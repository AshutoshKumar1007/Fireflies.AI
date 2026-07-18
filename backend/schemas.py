
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------

class ParticipantBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    avatar_color: str = Field(min_length=1, max_length=20)


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantResponse(ParticipantBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------
# Transcript
# ---------------------------------------------------------------------

class TranscriptSegmentResponse(BaseModel):
    id: int
    meeting_id: int

    speaker: ParticipantResponse | None = None

    start_time_seconds: float
    end_time_seconds: float

    text: str

    order_index: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------

class TopicResponse(BaseModel):
    id: int
    meeting_id: int

    title: str = Field(min_length=1, max_length=255)

    start_time_seconds: float

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------

class SummaryResponse(BaseModel):
    id: int
    meeting_id: int

    overview_text: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------
# Action Items
# ---------------------------------------------------------------------

class ActionItemCreate(BaseModel):
    text: str = Field(min_length=1)

    assignee_id: int | None = None

    due_date: date | None = None


class ActionItemUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)

    assignee_id: int | None = None

    is_completed: bool | None = None

    due_date: date | None = None


class ActionItemResponse(BaseModel):
    id: int

    meeting_id: int

    text: str

    assignee: ParticipantResponse | None = None

    is_completed: bool

    due_date: date | None = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------
# Meetings
# ---------------------------------------------------------------------

class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)

    date: datetime

    duration_seconds: int = Field(gt=0)

    participant_ids: list[int] = Field(default_factory=list)


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)

    date: datetime | None = None

    duration_seconds: int | None = Field(default=None, gt=0)

    participant_ids: list[int] | None = None


class MeetingListResponse(BaseModel):
    id: int

    title: str

    date: datetime

    duration_seconds: int

    created_at: datetime

    updated_at: datetime

    participants: list[ParticipantResponse] = Field(default_factory=list)

    summary: SummaryResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class MeetingDetailResponse(MeetingListResponse):
    transcript_segments: list[TranscriptSegmentResponse] = Field(default_factory=list)

    topics: list[TopicResponse] = Field(default_factory=list)

    action_items: list[ActionItemResponse] = Field(default_factory=list)


# ---------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------

class SearchResult(BaseModel):
    meeting_id: int

    meeting_title: str

    meeting_date: datetime

    snippet: str

    match_type: Literal["title", "transcript"]

    model_config = ConfigDict(from_attributes=True)