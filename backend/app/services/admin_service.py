from __future__ import annotations

import logging
import uuid
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.board import Board, Chapter, Class, Subject
from app.models.ingestion_job import IngestionJob
from app.models.user import Profile
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Users ─────────────────────────────────────────────────────────────

    def list_users(self, skip: int = 0, limit: int = 50) -> list[Profile]:
        return (
            self.db.query(Profile)
            .order_by(Profile.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_user_tier(self, user_id: str, tier: str) -> Profile:
        profile = self.db.query(Profile).filter(Profile.id == user_id).first()
        if not profile:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("User")
        profile.subscription_tier = tier
        self.db.commit()
        self.db.refresh(profile)
        return profile

    # ── Chapters ──────────────────────────────────────────────────────────

    def list_chapters(self) -> list[dict[str, Any]]:
        chapters = (
            self.db.query(Chapter)
            .order_by(Chapter.created_at.desc())
            .all()
        )
        result = []
        for ch in chapters:
            subj = ch.subject
            cls = subj.class_ if subj else None
            board = cls.board if cls else None
            result.append(
                {
                    "id": ch.id,
                    "chapter_number": ch.chapter_number,
                    "chapter_name": ch.chapter_name,
                    "status": ch.status,
                    "chunk_count": len(ch.text_chunks),
                    "subject": subj.subject_name if subj else None,
                    "class_number": cls.class_number if cls else None,
                    "board": board.name if board else None,
                    "created_at": ch.created_at,
                }
            )
        return result

    def get_job_status(self, job_id: str) -> IngestionJob:
        job = self.db.query(IngestionJob).filter(
            IngestionJob.id == uuid.UUID(job_id)
        ).first()
        if not job:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Ingestion job")
        return job

    # ── PDF Upload ────────────────────────────────────────────────────────

    def upload_pdf_and_enqueue(
        self,
        file_bytes: bytes,
        filename: str,
        board_name: str,
        class_number: int,
        subject_name: str,
        chapter_name: str,
        chapter_number: int,
    ) -> dict[str, Any]:
        """Upload PDF to S3, create/get curriculum hierarchy, enqueue ingestion."""
        from app.tasks.ingest import ingest_pdf_task

        # ── Ensure curriculum hierarchy exists ─────────────────────────────
        board = self._get_or_create_board(board_name)
        cls = self._get_or_create_class(board.id, class_number)
        subject = self._get_or_create_subject(cls.id, subject_name)
        chapter = self._get_or_create_chapter(
            subject.id, chapter_number, chapter_name
        )

        # ── Upload PDF to S3 ───────────────────────────────────────────────
        s3_key = (
            f"pdfs/{board_name.lower().replace(' ', '_')}/"
            f"class_{class_number}/"
            f"{subject_name.lower().replace(' ', '_')}/"
            f"chapter_{chapter_number}_{filename}"
        )
        import io
        storage_service.upload(io.BytesIO(file_bytes), s3_key)
        chapter.pdf_s3_key = s3_key
        chapter.status = "pending"

        # ── Create IngestionJob record ────────────────────────────────────
        job = IngestionJob(
            chapter_id=chapter.id,
            status="pending",
            pdf_s3_key=s3_key,
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        # ── Enqueue Celery task ────────────────────────────────────────────
        ingest_pdf_task.delay(str(job.id), chapter.id, s3_key)
        logger.info(f"[admin] Enqueued ingestion job {job.id} for chapter {chapter.id}")

        return {
            "job_id": str(job.id),
            "chapter_id": chapter.id,
            "chapter_name": chapter.chapter_name,
            "status": "pending",
        }

    # ── Private helpers ───────────────────────────────────────────────────

    def _get_or_create_board(self, name: str) -> Board:
        board = self.db.query(Board).filter(Board.name == name).first()
        if not board:
            code = name.upper().replace(" ", "_")[:20]
            board = Board(name=name, code=code)
            self.db.add(board)
            self.db.commit()
            self.db.refresh(board)
        return board

    def _get_or_create_class(self, board_id: int, class_number: int) -> Class:
        cls = (
            self.db.query(Class)
            .filter(Class.board_id == board_id, Class.class_number == class_number)
            .first()
        )
        if not cls:
            cls = Class(
                board_id=board_id,
                class_number=class_number,
                display_name=f"Class {class_number}",
            )
            self.db.add(cls)
            self.db.commit()
            self.db.refresh(cls)
        return cls

    def _get_or_create_subject(self, class_id: int, subject_name: str) -> Subject:
        subj = (
            self.db.query(Subject)
            .filter(Subject.class_id == class_id, Subject.subject_name == subject_name)
            .first()
        )
        if not subj:
            subj = Subject(class_id=class_id, subject_name=subject_name)
            self.db.add(subj)
            self.db.commit()
            self.db.refresh(subj)
        return subj

    def _get_or_create_chapter(
        self, subject_id: int, chapter_number: int, chapter_name: str
    ) -> Chapter:
        chapter = (
            self.db.query(Chapter)
            .filter(
                Chapter.subject_id == subject_id,
                Chapter.chapter_number == chapter_number,
            )
            .first()
        )
        if not chapter:
            chapter = Chapter(
                subject_id=subject_id,
                chapter_number=chapter_number,
                chapter_name=chapter_name,
                status="pending",
            )
            self.db.add(chapter)
            self.db.commit()
            self.db.refresh(chapter)
        else:
            # Update name if changed
            chapter.chapter_name = chapter_name
            self.db.commit()
        return chapter
