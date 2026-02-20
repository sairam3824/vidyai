from __future__ import annotations

import io
import logging
import uuid
from datetime import datetime, timezone

from openai import OpenAI
from pypdf import PdfReader

from app.config import settings
from app.worker import celery_app

logger = logging.getLogger(__name__)

CHUNK_SIZE = 900
CHUNK_OVERLAP = 100
BATCH_SIZE = 20


@celery_app.task(bind=True, name="ingest_pdf", max_retries=3)
def ingest_pdf_task(self, job_id: str, chapter_id: int, pdf_s3_key: str) -> dict:
    """Download PDF from S3, generate embeddings, store chunks in Supabase.

    Updates IngestionJob and Chapter status throughout.
    """
    from app.database import SessionLocal
    from app.models.board import Chapter
    from app.models.ingestion_job import IngestionJob
    from app.models.text_chunk import TextChunk
    from app.services.storage_service import storage_service

    db = SessionLocal()
    chapter = None
    job = None

    try:
        job = db.query(IngestionJob).filter(IngestionJob.id == uuid.UUID(job_id)).first()
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()

        if not chapter:
            raise ValueError(f"Chapter {chapter_id} not found")

        # Mark as processing
        if job:
            job.status = "processing"
            job.started_at = datetime.now(timezone.utc)
        chapter.status = "processing"
        db.commit()

        # ── Download PDF ────────────────────────────────────────────────────
        logger.info(f"[ingest] Downloading PDF: {pdf_s3_key}")
        pdf_bytes = storage_service.download(pdf_s3_key)

        # ── Extract and chunk text ──────────────────────────────────────────
        reader = PdfReader(io.BytesIO(pdf_bytes))
        all_chunks: list[dict] = []

        for page_num, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            start = 0
            while start < len(text):
                chunk_text = text[start : start + CHUNK_SIZE].strip()
                if chunk_text:
                    all_chunks.append(
                        {
                            "content": chunk_text,
                            "page_number": page_num + 1,
                            "chunk_index": len(all_chunks),
                        }
                    )
                start += CHUNK_SIZE - CHUNK_OVERLAP

        logger.info(f"[ingest] chapter={chapter_id}: {len(all_chunks)} chunks extracted")

        # ── Clear existing chunks for this chapter ──────────────────────────
        db.query(TextChunk).filter(TextChunk.chapter_id == chapter_id).delete()
        db.commit()

        # ── Generate embeddings in batches and store ────────────────────────
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        for i in range(0, len(all_chunks), BATCH_SIZE):
            batch = all_chunks[i : i + BATCH_SIZE]
            texts = [c["content"] for c in batch]

            response = openai_client.embeddings.create(
                input=texts,
                model=settings.OPENAI_EMBEDDING_MODEL,
            )
            embeddings = [item.embedding for item in response.data]

            for j, emb in enumerate(embeddings):
                db.add(
                    TextChunk(
                        chapter_id=chapter_id,
                        content=batch[j]["content"],
                        chunk_index=batch[j]["chunk_index"],
                        page_number=batch[j]["page_number"],
                        embedding=emb,
                    )
                )
            db.commit()
            logger.info(
                f"[ingest] chapter={chapter_id}: embedded batch {i // BATCH_SIZE + 1}"
            )

        # ── Mark as ready ───────────────────────────────────────────────────
        chapter.status = "ready"
        chapter.error_message = None
        if job:
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"[ingest] chapter={chapter_id}: ingestion complete")
        return {"status": "completed", "chapter_id": chapter_id, "chunks": len(all_chunks)}

    except Exception as exc:
        logger.error(f"[ingest] chapter={chapter_id} FAILED: {exc}", exc_info=True)
        db.rollback()
        try:
            if chapter:
                chapter.status = "failed"
                chapter.error_message = str(exc)
            if job:
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.now(timezone.utc)
            db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
