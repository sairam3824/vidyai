from __future__ import annotations

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UsageTracking(Base):
    """Tracks how many tests a user has generated in the current ISO week."""

    __tablename__ = "usage_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    week_start = Column(Date, nullable=False)  # ISO Monday (YYYY-MM-DD)
    tests_generated = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_user_week"),
    )

    user = relationship("Profile", back_populates="usage_tracking")

    def __repr__(self) -> str:
        return f"<UsageTracking user={self.user_id} week={self.week_start} count={self.tests_generated}>"
