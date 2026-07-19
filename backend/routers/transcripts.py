import re

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Meeting, Participant, TranscriptSegment
from schemas import TranscriptSegmentResponse

from core.lookup import get_meeting_or_404

router = APIRouter(tags=["Transcripts"])


TIMESTAMP_PATTERN = re.compile(
    r"^\s*(.+?)\s*\[(?:(\d+):)?(\d{1,2}):(\d{2})\]\s*:\s*(.+)$"
)

TIMESTAMP_FIRST_PATTERN = re.compile(
    r"^\s*\[(?:(\d+):)?(\d{1,2}):(\d{2})\]\s*(.+?)\s*:\s*(.+)$"
)

SIMPLE_PATTERN = re.compile(
    r"^\s*(.+?)\s*:\s*(.+)$"
)


def parse_timestamp(
    hours: str | None,
    minutes: str,
    seconds: str,
) -> int:
    h = int(hours) if hours else 0
    m = int(minutes)
    s = int(seconds)

    return h * 3600 + m * 60 + s

def get_participant(
    db: Session,
    cache: dict[str, Participant],
    name: str,
) -> Participant | None:

    normalized = " ".join(name.split())
    key = normalized.lower()

    if key in cache:
        return cache[key]

    participant = (
        db.query(Participant)
        .filter(Participant.name.ilike(normalized))
        .first()
    )

    if participant:
        cache[key] = participant

    return participant

class ParsedLine:
    """Result of matching a single raw transcript line against the
    supported formats below."""

    __slots__ = ("speaker_name", "start_seconds", "text")

    def __init__(
        self,
        speaker_name: str | None,
        start_seconds: int | None,
        text: str,
    ) -> None:
        self.speaker_name = speaker_name
        self.start_seconds = start_seconds
        self.text = text


def match_line(line: str) -> ParsedLine:
    """Try each supported transcript line format in turn, most specific
    first:
      - "Speaker [MM:SS]: text" / "Speaker [H:MM:SS]: text"
      - "[MM:SS] Speaker: text" / "[H:MM:SS] Speaker: text"
      - "Speaker: text" (no timestamp)
      - plain text with no speaker or timestamp at all
    """
    match = TIMESTAMP_PATTERN.match(line)
    if match:
        speaker_name, hours, minutes, seconds, text = match.groups()
        return ParsedLine(
            speaker_name=speaker_name,
            start_seconds=parse_timestamp(hours, minutes, seconds),
            text=text,
        )

    match = TIMESTAMP_FIRST_PATTERN.match(line)
    if match:
        hours, minutes, seconds, speaker_name, text = match.groups()
        return ParsedLine(
            speaker_name=speaker_name,
            start_seconds=parse_timestamp(hours, minutes, seconds),
            text=text,
        )

    match = SIMPLE_PATTERN.match(line)
    if match:
        speaker_name, text = match.groups()
        return ParsedLine(speaker_name=speaker_name, start_seconds=None, text=text)

    return ParsedLine(speaker_name=None, start_seconds=None, text=line)


def parse_transcript(
    db: Session,
    meeting: Meeting,
    transcript: str,
) -> list[TranscriptSegment]:

    participant_cache: dict[str, Participant] = {}

    segments: list[TranscriptSegment] = []

    lines = [
        line.strip()
        for line in transcript.splitlines()
        if line.strip()
    ]

    for order_index, line in enumerate(lines):
        parsed = match_line(line)

        speaker = (
            get_participant(db, participant_cache, parsed.speaker_name)
            if parsed.speaker_name
            else None
        )

        segments.append(
            TranscriptSegment(
                meeting_id=meeting.id,
                speaker_id=speaker.id if speaker else None,
                start_time_seconds=parsed.start_seconds,
                text=parsed.text,
                order_index=order_index,
            )
        )

    if segments:
        _normalize_segment_timing(segments, meeting.duration_seconds)

    return segments


def _normalize_segment_timing(
    segments: list[TranscriptSegment],
    duration_seconds: int | None,
) -> None:
    """Assign start/end times to every segment such that the DB's
    `start_time_seconds < end_time_seconds` constraint always holds, even
    when the uploaded transcript mixes timestamped and un-timestamped
    lines, or has timestamps that aren't in chronological order."""

    n = len(segments)
    known = [i for i, s in enumerate(segments) if s.start_time_seconds is not None]

    if not known:
        for i, segment in enumerate(segments):
            segment.start_time_seconds = (
                duration_seconds * i / n if duration_seconds else float(i)
            )
    else:
        # Interpolate any un-timestamped run before the first known point.
        first = known[0]
        if first > 0:
            end_val = segments[first].start_time_seconds
            step = end_val / (first + 1)
            for i in range(first):
                segments[i].start_time_seconds = step * i

        # Interpolate un-timestamped runs between two known points.
        for a, b in zip(known, known[1:]):
            gap = b - a
            if gap <= 1:
                continue
            start_val = segments[a].start_time_seconds
            step = (segments[b].start_time_seconds - start_val) / gap
            for offset in range(1, gap):
                segments[a + offset].start_time_seconds = start_val + step * offset

        # Interpolate any un-timestamped run after the last known point.
        last = known[-1]
        if last < n - 1:
            start_val = segments[last].start_time_seconds
            remaining = n - 1 - last
            end_val = (
                duration_seconds
                if duration_seconds and duration_seconds > start_val
                else start_val + remaining
            )
            step = max((end_val - start_val) / (remaining + 1), 1.0)
            for offset in range(1, remaining + 1):
                segments[last + offset].start_time_seconds = start_val + step * offset

    # Guarantee non-decreasing start times, even for explicit timestamps
    # that were typed out of chronological order.
    for i in range(1, n):
        if segments[i].start_time_seconds < segments[i - 1].start_time_seconds:
            segments[i].start_time_seconds = segments[i - 1].start_time_seconds

    # End time = next segment's start, unless that would violate
    # start < end (e.g. two segments sharing the same start second).
    for i in range(n - 1):
        start = segments[i].start_time_seconds
        end = segments[i + 1].start_time_seconds
        segments[i].end_time_seconds = end if end > start else start + 1.0

    last_segment = segments[-1]
    if duration_seconds and duration_seconds > last_segment.start_time_seconds:
        last_segment.end_time_seconds = float(duration_seconds)
    else:
        last_segment.end_time_seconds = last_segment.start_time_seconds + 1.0
@router.post(
    "/meetings/{meeting_id}/transcript",
    response_model=list[TranscriptSegmentResponse],
)
def upload_transcript(
    meeting_id: int,
    transcript: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        db,
        meeting_id,
    )

    if not transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty",
        )

    try:
        # Replace any existing transcript so uploads are idempotent.
        db.query(TranscriptSegment).filter(
            TranscriptSegment.meeting_id == meeting.id
        ).delete(synchronize_session=False)

        segments = parse_transcript(
            db=db,
            meeting=meeting,
            transcript=transcript,
        )

        db.add_all(segments)

        db.commit()

    except Exception:
        db.rollback()
        raise

    return (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting.id)
        .order_by(TranscriptSegment.order_index)
        .all()
    )


@router.get(
    "/meetings/{meeting_id}/transcript",
    response_model=list[TranscriptSegmentResponse],
)
def get_transcript(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(
        db,
        meeting_id,
    )
    return (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting.id)
        .order_by(TranscriptSegment.order_index)
        .all()
    )