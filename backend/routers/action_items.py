
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ActionItem, Meeting, Participant
from schemas import (
    ActionItemCreate,
    ActionItemResponse,
    ActionItemUpdate,
)

from core.lookup import (
    get_action_item_or_404,
    get_meeting_or_404,
    get_participant_or_404,
)

router = APIRouter(tags=["Action Items"])

def validate_assignee(
    db: Session,
    assignee_id: int | None,
) -> None:
    if assignee_id is None:
        return

    get_participant_or_404(
        db,
        assignee_id,
    )
    
    
@router.post(
    "/meetings/{meeting_id}/action-items",
    response_model=ActionItemResponse,
    status_code=201,
)
def create_action_item(
    meeting_id: int,
    item: ActionItemCreate,
    db: Session = Depends(get_db),
):
    get_meeting_or_404(db, meeting_id)
    validate_assignee(db, item.assignee_id)

    action_item = ActionItem(
        meeting_id=meeting_id,
        text=item.text,
        assignee_id=item.assignee_id,
        due_date=item.due_date,
    )

    db.add(action_item)
    db.commit()
    db.refresh(action_item)

    return action_item


@router.patch(
    "/action-items/{action_item_id}",
    response_model=ActionItemResponse,
)
def update_action_item(
    action_item_id: int,
    update_data: ActionItemUpdate,
    db: Session = Depends(get_db),
):
    action_item = get_action_item_or_404(
        db,
        action_item_id,
    )

    updates = update_data.model_dump(
        exclude_unset=True,
    )

    validate_assignee(
        db,
        updates.get("assignee_id"),
    )

    for field, value in updates.items():
        setattr(action_item, field, value)

    db.commit()
    db.refresh(action_item)

    return action_item


@router.delete("/action-items/{action_item_id}")
def delete_action_item(
    action_item_id: int,
    db: Session = Depends(get_db),
):
    action_item = get_action_item_or_404(
        db,
        action_item_id,
    )

    db.delete(action_item)
    db.commit()

    return {
        "detail": "Action item deleted",
    }