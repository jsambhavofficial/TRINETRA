"""
SQLAlchemy Declarative Base with standard UUID and timestamp columns.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class TimeStampedModel(Base):
    __abstract__ = True

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"nexus-{uuid.uuid4().hex[:12]}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now
    )
