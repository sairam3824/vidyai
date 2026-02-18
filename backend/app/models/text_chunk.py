from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config import settings
from app.database import Base

try:
    from pgvector.sqlalchemy import Vector

    _VECTOR_TYPE = Vector(settings.EMBEDDING_DIMENSIONS)
except ImportError:
    # Fallback for environments without pgvector installed (CI / type-checkers)
    _VECTOR_TYPE = Text  # type: ignore[assignment]


class TextChunk(Base):
    """A chunked piece of textbook content with its vector embedding."""

    __tablename__ = "text_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(
        Integer,
        ForeignKey("chapters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSIONS), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chapter = relationship("Chapter", back_populates="text_chunks")

    def __repr__(self) -> str:
        return f"<TextChunk chapter={self.chapter_id} idx={self.chunk_index}>"
