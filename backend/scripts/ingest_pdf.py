"""
Ingest a textbook PDF: chunk → embed → store in PostgreSQL.

Usage:
    python scripts/ingest_pdf.py --pdf /path/to/textbook.pdf --chapter-id 1

Requirements:
    pip install pypdf
"""
from __future__ import annotations

import argparse
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

try:
    import pypdf
except ImportError:
    logger.error("pypdf not installed. Run: pip install pypdf")
    sys.exit(1)

from openai import OpenAI

from app.config import settings
from app.database import SessionLocal
from app.models.board import Chapter
from app.models.text_chunk import TextChunk

CHUNK_SIZE = 900      # characters
CHUNK_OVERLAP = 100   # characters of overlap between adjacent chunks
BATCH_SIZE = 20       # embeddings per API call


def extract_pages(pdf_path: str) -> list[tuple[int, str]]:
    """Return [(page_number, text), ...] for every non-empty page."""
    pages = []
    with open(pdf_path, "rb") as fh:
        reader = pypdf.PdfReader(fh)
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append((i, text))
    return pages


def chunk_text(text: str) -> list[str]:
    """Split *text* into overlapping windows of CHUNK_SIZE characters."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        snippet = text[start:end].strip()
        if snippet:
            chunks.append(snippet)
        start = end - CHUNK_OVERLAP
    return chunks


def ingest_pdf(pdf_path: str, chapter_id: int) -> None:
    db = SessionLocal()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            logger.error(f"Chapter id={chapter_id} not found.")
            return

        # Clear existing chunks for a clean re-ingest
        deleted = db.query(TextChunk).filter(TextChunk.chapter_id == chapter_id).delete()
        db.commit()
        if deleted:
            logger.info(f"Removed {deleted} existing chunks for chapter {chapter_id}")

        pages = extract_pages(pdf_path)
        logger.info(f"Extracted {len(pages)} pages from '{pdf_path}'")

        all_chunks: list[tuple[int, str]] = []
        for page_num, page_text in pages:
            for snippet in chunk_text(page_text):
                all_chunks.append((page_num, snippet))

        logger.info(f"Created {len(all_chunks)} text chunks — generating embeddings…")

        global_idx = 0
        for batch_start in range(0, len(all_chunks), BATCH_SIZE):
            batch = all_chunks[batch_start : batch_start + BATCH_SIZE]
            texts = [c[1] for c in batch]

            response = client.embeddings.create(
                input=texts,
                model=settings.OPENAI_EMBEDDING_MODEL,
            )

            for j, (page_num, content) in enumerate(batch):
                db.add(
                    TextChunk(
                        chapter_id=chapter_id,
                        content=content,
                        chunk_index=global_idx,
                        page_number=page_num,
                        embedding=response.data[j].embedding,
                    )
                )
                global_idx += 1

            db.commit()
            logger.info(f"Progress: {min(batch_start + BATCH_SIZE, len(all_chunks))}/{len(all_chunks)}")

        logger.info(
            f"✓ Ingestion complete. {global_idx} chunks stored for chapter {chapter_id} "
            f"({chapter.chapter_name})."
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"Ingestion failed: {exc}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a PDF chapter into Vidyai")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file")
    parser.add_argument("--chapter-id", type=int, required=True, help="Target chapter ID")
    args = parser.parse_args()
    ingest_pdf(args.pdf, args.chapter_id)
