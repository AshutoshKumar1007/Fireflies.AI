
from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import (
    ActionItem,
    Meeting,
    Participant,
    TranscriptSegment,
)
from schemas import (
    MeetingCreate,
    MeetingDetailResponse,
    MeetingListResponse,
    MeetingUpdate,
)


router = APIRouter(prefix="/meetings", tags=["Meetings"])


def format_timestamp(seconds: float | int | None) -> str:
    """Convert seconds into MM:SS format."""
    if seconds is None:
        return "00:00"

    total = int(seconds)
    minutes = total // 60
    seconds = total % 60
    return f"{minutes:02d}:{seconds:02d}"


def sanitize_filename(title: str) -> str:
    """Create a filesystem-friendly filename."""
    filename = re.sub(r"[^\w\-]+", "_", title.strip())
    return filename.strip("_") or "meeting"


@router.get("", response_model=list[MeetingListResponse])
def list_meetings(
    search: str | None = None,
    participant: int | None = None,
    sort: str = "date_desc",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Meeting).options(
        selectinload(Meeting.participants),
        selectinload(Meeting.summary),
    )

    if search:
        query = query.filter(Meeting.title.ilike(f"%{search}%"))

    if participant:
        query = query.filter(
            Meeting.participants.any(Participant.id == participant)
        )

    if date_from:
        query = query.filter(Meeting.date >= date_from)

    if date_to:
        query = query.filter(Meeting.date <= date_to)

    if sort == "date_desc":
        query = query.order_by(desc(Meeting.date))
    elif sort == "date_asc":
        query = query.order_by(asc(Meeting.date))
    else:
        raise HTTPException(
            status_code=400,
            detail="sort must be either 'date_desc' or 'date_asc'",
        )

    return query.all()


@router.post("", response_model=MeetingListResponse, status_code=201)
def create_meeting(
    meeting: MeetingCreate,
    db: Session = Depends(get_db),
):
    new_meeting = Meeting(
        title=meeting.title,
        date=meeting.date,
        duration_seconds=meeting.duration_seconds,
    )

    if meeting.participant_ids:
        participants = (
            db.query(Participant)
            .filter(Participant.id.in_(meeting.participant_ids))
            .all()
        )

        if len(participants) != len(meeting.participant_ids):
            raise HTTPException(
                status_code=404,
                detail="One or more participants not found",
            )

        new_meeting.participants.extend(participants)

    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    return new_meeting


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    meeting = (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.transcript_segments).selectinload(
                TranscriptSegment.speaker
            ),
            selectinload(Meeting.topics),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items).selectinload(
                ActionItem.assignee
            ),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    meeting.transcript_segments.sort(key=lambda segment: segment.order_index)

    return meeting


@router.put("/{meeting_id}", response_model=MeetingListResponse)
def update_meeting(
    meeting_id: int,
    meeting_update: MeetingUpdate,
    db: Session = Depends(get_db),
):
    meeting = (
        db.query(Meeting)
        .options(selectinload(Meeting.participants))
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    update_data = meeting_update.model_dump(exclude_unset=True)
    participant_ids = update_data.pop("participant_ids", None)

    for key, value in update_data.items():
        setattr(meeting, key, value)

    if participant_ids is not None:
        participants = (
            db.query(Participant)
            .filter(Participant.id.in_(participant_ids))
            .all()
        )

        if len(participants) != len(participant_ids):
            raise HTTPException(
                status_code=404,
                detail="One or more participants not found",
            )

        meeting.participants = participants

    db.commit()
    db.refresh(meeting)

    return meeting

@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    db.delete(meeting)
    db.commit()

    return {"detail": "Meeting deleted"}


@router.get("/{meeting_id}/export")
def export_meeting(
    meeting_id: int,
    format: str = Query(
        default="md",
        pattern="^(md|txt)$",
    ),
    db: Session = Depends(get_db),
):
    meeting = (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.transcript_segments).selectinload(
                TranscriptSegment.speaker
            ),
            selectinload(Meeting.topics),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items).selectinload(
                ActionItem.assignee
            ),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    meeting.transcript_segments.sort(
        key=lambda segment: segment.order_index
    )

    filename = sanitize_filename(meeting.title)

    if format == "txt":
        lines: list[str] = []

        lines.append(f"Title: {meeting.title}")
        lines.append(
            f"Date: {meeting.date.strftime('%Y-%m-%d %H:%M:%S')}"
        )

        if meeting.duration_seconds:
            lines.append(
                f"Duration: {meeting.duration_seconds // 60} minutes"
            )

        lines.append("")

        if meeting.participants:
            lines.append(
                "Participants: "
                + ", ".join(
                    participant.name
                    for participant in meeting.participants
                )
            )
            lines.append("")

        if meeting.summary:
            lines.append("SUMMARY")
            lines.append(meeting.summary.overview_text)
            lines.append("")

        if meeting.topics:
            lines.append("TOPICS")

            for topic in meeting.topics:
                lines.append(
                    f"[{format_timestamp(topic.start_time_seconds)}] "
                    f"{topic.title}"
                )

            lines.append("")

        if meeting.action_items:
            lines.append("ACTION ITEMS")

            for item in meeting.action_items:
                assignee = (
                    item.assignee.name
                    if item.assignee
                    else "Unassigned"
                )

                status = "[x]" if item.is_completed else "[ ]"

                due = (
                    f" (Due: {item.due_date})"
                    if item.due_date
                    else ""
                )

                lines.append(
                    f"{status} {item.text} "
                    f"- {assignee}{due}"
                )

            lines.append("")

        lines.append("TRANSCRIPT")

        for segment in meeting.transcript_segments:
            speaker = (
                segment.speaker.name
                if segment.speaker
                else "Unknown"
            )

            timestamp = format_timestamp(
                segment.start_time_seconds
            )

            lines.append(
                f"[{timestamp}] {speaker}: {segment.text}"
            )

        content = "\n".join(lines)

        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition":
                    f'attachment; filename="{filename}.txt"'
            },
        )
        
    # Markdown export
    lines: list[str] = []

    lines.append(f"# {meeting.title}")
    lines.append("")
    lines.append(
        f"**Date:** {meeting.date.strftime('%B %d, %Y • %I:%M %p')}"
    )

    if meeting.duration_seconds:
        lines.append(
            f"**Duration:** {meeting.duration_seconds // 60} minutes"
        )

    if meeting.participants:
        participant_names = ", ".join(
            participant.name
            for participant in meeting.participants
        )
        lines.append(f"**Participants:** {participant_names}")

    lines.append("")
    lines.append("---")
    lines.append("")

    if meeting.summary:
        lines.append("## Summary")
        lines.append("")
        lines.append(meeting.summary.overview_text)
        lines.append("")

    if meeting.topics:
        lines.append("## Topics")
        lines.append("")

        for topic in meeting.topics:
            timestamp = format_timestamp(topic.start_time_seconds)
            lines.append(
                f"- **{timestamp}** — {topic.title}"
            )

        lines.append("")

    if meeting.action_items:
        lines.append("## Action Items")
        lines.append("")

        for item in meeting.action_items:
            assignee = (
                f"**{item.assignee.name}**"
                if item.assignee
                else "_Unassigned_"
            )

            status = "- [x]" if item.is_completed else "- [ ]"

            due = (
                f" _(Due: {item.due_date})_"
                if item.due_date
                else ""
            )

            lines.append(
                f"{status} {item.text} — {assignee}{due}"
            )

        lines.append("")

    lines.append("## Transcript")
    lines.append("")

    for segment in meeting.transcript_segments:
        speaker = (
            segment.speaker.name
            if segment.speaker
            else "Unknown"
        )

        timestamp = format_timestamp(
            segment.start_time_seconds
        )

        lines.append(
            f"### {speaker} [{timestamp}]"
        )
        lines.append("")
        lines.append(segment.text)
        lines.append("")

    content = "\n".join(lines)

    return Response(
        content=content,
        media_type="text/markdown",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}.md"'
        },
    )