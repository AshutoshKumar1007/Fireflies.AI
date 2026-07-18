
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Meeting, Participant, TranscriptSegment
from schemas import ParticipantResponse, SearchResult

router = APIRouter(tags=["Search"])


def make_snippet(text: str, max_length: int = 200) -> str:
    """Return a truncated snippet suitable for search results."""
    if len(text) <= max_length:
        return text

    return text[: max_length - 3].rstrip() + "..."


@router.get(
    "/participants",
    response_model=list[ParticipantResponse],
)
def list_participants(
    db: Session = Depends(get_db),
):
    return (
        db.query(Participant)
        .order_by(Participant.name)
        .all()
    )


@router.get(
    "/search",
    response_model=list[SearchResult],
)
def search_global(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    query = f"%{q.strip()}%"

    results: dict[int, SearchResult] = {}

    title_matches = (
        db.query(Meeting)
        .filter(Meeting.title.ilike(query))
        .all()
    )

    for meeting in title_matches:
        results[meeting.id] = SearchResult(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            meeting_date=meeting.date,
            match_type="title",
            snippet=meeting.title,
        )

    transcript_matches = (
        db.query(TranscriptSegment)
        .options(selectinload(TranscriptSegment.meeting))
        .filter(TranscriptSegment.text.ilike(query))
        .all()
    )

    for segment in transcript_matches:
        if segment.meeting_id in results:
            continue

        results[segment.meeting_id] = SearchResult(
            meeting_id=segment.meeting_id,
            meeting_title=segment.meeting.title,
            meeting_date=segment.meeting.date,
            match_type="transcript",
            snippet=make_snippet(segment.text),
        )

    return list(results.values())