from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Board(Base):
    """Top-level board, e.g. CBSE, ICSE, Maharashtra State Board."""

    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    classes = relationship("Class", back_populates="board", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Board code={self.code}>"


class Class(Base):
    """e.g. Class 10 under CBSE."""

    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    class_number = Column(Integer, nullable=False)
    display_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    board = relationship("Board", back_populates="classes")
    subjects = relationship("Subject", back_populates="class_", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Class {self.display_name}>"


class Subject(Base):
    """e.g. Mathematics under Class 10 CBSE."""

    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    subject_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    class_ = relationship("Class", back_populates="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Subject {self.subject_name}>"


class Chapter(Base):
    """Individual chapter within a subject."""

    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    chapter_name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    # Ingestion status: pending | processing | ready | failed
    status = Column(String(20), default="ready", nullable=False)
    pdf_s3_key = Column(Text, nullable=True)   # S3 key of the source PDF
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="chapters")
    text_chunks = relationship(
        "TextChunk", back_populates="chapter", cascade="all, delete-orphan"
    )
    generated_tests = relationship("GeneratedTest", back_populates="chapter")
    ingestion_jobs = relationship("IngestionJob", back_populates="chapter", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Chapter {self.chapter_number}: {self.chapter_name}>"
