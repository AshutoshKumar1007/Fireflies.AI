from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import (
    ActionItem,
    Meeting,
    Participant,
)


def get_meeting_or_404(
    db: Session,
    meeting_id: int,
) -> Meeting:
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

    return meeting


def get_participant_or_404(
    db: Session,
    participant_id: int,
) -> Participant:
    participant = (
        db.query(Participant)
        .filter(Participant.id == participant_id)
        .first()
    )

    if participant is None:
        raise HTTPException(
            status_code=404,
            detail="Participant not found",
        )

    return participant


def get_action_item_or_404(
    db: Session,
    action_item_id: int,
) -> ActionItem:
    action_item = (
        db.query(ActionItem)
        .filter(ActionItem.id == action_item_id)
        .first()
    )

    if action_item is None:
        raise HTTPException(
            status_code=404,
            detail="Action item not found",
        )

    return action_item