from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, JSON, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class QuestionCache(Base):
    """Shared question bank keyed on (chapter_id, num_questions).

    When multiple users request the same chapter + question count within
    the TTL window, the stored questions_json is reused and the expensive
    RAG + OpenAI pipeline is skipped entirely.
    """

    __tablename__ = "question_cache"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, nullable=False, index=True)
    num_questions = Column(Integer, nullable=False)
    questions_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("chapter_id", "num_questions", name="uq_question_cache"),
    )

    def __repr__(self) -> str:
        return (
            f"<QuestionCache chapter={self.chapter_id} "
            f"num_q={self.num_questions} expires={self.expires_at}>"
        )
