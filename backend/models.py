
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column(
        "meeting_id",
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "participant_id",
        Integer,
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    avatar_color = Column(String(20), nullable=False)

    meetings = relationship(
        "Meeting",
        secondary=meeting_participants,
        back_populates="participants",
    )


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)

    title = Column(String(255), nullable=False)
    date = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    participants = relationship(
        "Participant",
        secondary=meeting_participants,
        back_populates="meetings",
    )

    transcript_segments = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )

    topics = relationship(
        "Topic",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )

    summary = relationship(
        "Summary",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
    )

    action_items = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    __table_args__ = (
        CheckConstraint(
            "start_time_seconds < end_time_seconds",
            name="ck_transcript_time_range",
        ),
        Index(
            "ix_transcript_meeting_order",
            "meeting_id",
            "order_index",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )

    speaker_id = Column(
        Integer,
        ForeignKey("participants.id", ondelete="SET NULL"),
        nullable=True,
    )

    start_time_seconds = Column(Float, nullable=False)
    end_time_seconds = Column(Float, nullable=False)

    text = Column(Text, nullable=False)

    order_index = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="transcript_segments")
    speaker = relationship("Participant")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    start_time_seconds = Column(Float, nullable=False)

    meeting = relationship("Meeting", back_populates="topics")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    overview_text = Column(Text, nullable=False)

    meeting = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, autoincrement=True)

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )

    text = Column(Text, nullable=False)

    assignee_id = Column(
        Integer,
        ForeignKey("participants.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_completed = Column(Boolean, default=False, nullable=False)

    due_date = Column(Date)

    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship("Participant")