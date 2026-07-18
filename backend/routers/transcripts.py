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

        match = TIMESTAMP_PATTERN.match(line)

        if match:

            speaker_name = match.group(1)

            start_seconds = parse_timestamp(
                match.group(2),
                match.group(3),
                match.group(4),
            )

            text = match.group(5)

            speaker = get_participant(
                db,
                participant_cache,
                speaker_name,
            )

            segments.append(
                TranscriptSegment(
                    meeting_id=meeting.id,
                    speaker_id=speaker.id if speaker else None,
                    start_time_seconds=start_seconds,
                    text=text,
                    order_index=order_index,
                )
            )

            continue
        match = TIMESTAMP_FIRST_PATTERN.match(line)

        if match:

            start_seconds = parse_timestamp(
                match.group(1),
                match.group(2),
                match.group(3),
            )

            speaker_name = match.group(4)
            text = match.group(5)

            speaker = get_participant(
                db,
                participant_cache,
                speaker_name,
            )

            segments.append(
                TranscriptSegment(
                    meeting_id=meeting.id,
                    speaker_id=speaker.id if speaker else None,
                    start_time_seconds=start_seconds,
                    text=text,
                    order_index=order_index,
                )
            )

            continue
        match = SIMPLE_PATTERN.match(line)

        if match:

            speaker_name = match.group(1)

            text = match.group(2)

            speaker = get_participant(
                db,
                participant_cache,
                speaker_name,
            )

            segments.append(
                TranscriptSegment(
                    meeting_id=meeting.id,
                    speaker_id=speaker.id if speaker else None,
                    text=text,
                    order_index=order_index,
                )
            )

            continue

        segments.append(
            TranscriptSegment(
                meeting_id=meeting.id,
                text=line,
                order_index=order_index,
            )
        )

    if segments:

        # Fill in any missing start times.
        missing = [
            segment
            for segment in segments
            if segment.start_time_seconds is None
        ]

        if meeting.duration_seconds and missing:
            for index, segment in enumerate(missing):
                segment.start_time_seconds = (
                    meeting.duration_seconds
                    * index
                    / len(missing)
                )

        elif missing:
            for index, segment in enumerate(missing):
                segment.start_time_seconds = float(index)

        # Compute end times.
        for i in range(len(segments) - 1):
            segments[i].end_time_seconds = (
                segments[i + 1].start_time_seconds
            )

        if meeting.duration_seconds:
            segments[-1].end_time_seconds = float(meeting.duration_seconds)
        else:
            segments[-1].end_time_seconds = (
                segments[-1].start_time_seconds + 1.0
            )

    return segments
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