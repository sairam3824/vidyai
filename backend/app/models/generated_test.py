from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class GeneratedTest(Base):
    """A single AI-generated test session for a user on a specific chapter."""

    __tablename__ = "generated_tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chapter_id = Column(
        Integer,
        ForeignKey("chapters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    questions_json = Column(JSON, nullable=False)
    score = Column(Float, nullable=True)            # 0–100, set after submission
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("Profile", back_populates="generated_tests")
    chapter = relationship("Chapter", back_populates="generated_tests")

    def __repr__(self) -> str:
        return f"<GeneratedTest id={self.id} user={self.user_id} score={self.score}>"
