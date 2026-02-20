"""
Bulk-ingest all CBSE Class 10 Mathematics PDF chapters.

Looks up each chapter by chapter_number in the DB, then calls ingest_pdf.

Usage:
    python scripts/ingest_all_cbse10_math.py [--pdf-dir /path/to/pdfs] [--dry-run]

Defaults:
    --pdf-dir  ../../CBSC/Class 10/Mathematics  (relative to this script)
"""
from __future__ import annotations

import argparse
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

from app.database import SessionLocal
from app.models.board import Board, Chapter, Class, Subject

# Maps chapter_number → PDF filename (relative to --pdf-dir)
CHAPTER_PDF_MAP: dict[int, str] = {
    1: "Real Numbers chapter 1.pdf",
    2: "Polynomials chapter 2.pdf",
    3: "Pair Of Liner Equations In Two Variables chapter 3.pdf",
    4: "Quadratic Equations chapter 4.pdf",
    5: "Arthmetic Progression chapter 5.pdf",
    6: "Traingles chapter 6.pdf",
    7: "Coordinate Geometry chapter 7.pdf",
    8: "Introduction to Trignometry chapter 8.pdf",
    9: "Some Applications of Trignometry chapter 9.pdf",
    10: "Circles chapter 10.pdf",
    11: "Areas Related to Circles chapter 11.pdf",
    12: "Surface Areas and Volumes chapter 12.pdf",
    13: "Statistics chapter 13.pdf",
    14: "Probability chapter 14.pdf",
}

DEFAULT_PDF_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "CBSC", "Class 10", "Mathematics",
)


def get_cbse_math_chapters(db) -> dict[int, int]:
    """Return {chapter_number: chapter_id} for CBSE Class 10 Mathematics."""
    board = db.query(Board).filter(Board.code == "CBSE").first()
    if not board:
        raise RuntimeError("CBSE board not found — run seed_data.py first.")

    cls10 = (
        db.query(Class)
        .filter(Class.board_id == board.id, Class.class_number == 10)
        .first()
    )
    if not cls10:
        raise RuntimeError("Class 10 not found under CBSE board.")

    maths = (
        db.query(Subject)
        .filter(Subject.class_id == cls10.id, Subject.subject_code == "MATH")
        .first()
    )
    if not maths:
        raise RuntimeError("Mathematics subject not found for CBSE Class 10.")

    chapters = db.query(Chapter).filter(Chapter.subject_id == maths.id).all()
    if not chapters:
        raise RuntimeError("No chapters found — run seed_data.py first.")

    return {ch.chapter_number: ch.id for ch in chapters}


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk-ingest CBSE Class 10 Math PDFs")
    parser.add_argument(
        "--pdf-dir",
        default=DEFAULT_PDF_DIR,
        help="Directory containing the chapter PDFs",
    )
    parser.add_argument(
        "--chapters",
        nargs="*",
        type=int,
        help="Specific chapter numbers to ingest (default: all 14)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be ingested without actually running",
    )
    args = parser.parse_args()

    pdf_dir = os.path.abspath(args.pdf_dir)
    if not os.path.isdir(pdf_dir):
        logger.error(f"PDF directory not found: {pdf_dir}")
        sys.exit(1)

    db = SessionLocal()
    try:
        chapter_id_map = get_cbse_math_chapters(db)
        logger.info(f"Found {len(chapter_id_map)} chapters in DB: {sorted(chapter_id_map)}")
    finally:
        db.close()

    chapters_to_ingest = sorted(args.chapters or CHAPTER_PDF_MAP.keys())

    errors: list[str] = []
    success: list[int] = []

    for chapter_num in chapters_to_ingest:
        filename = CHAPTER_PDF_MAP.get(chapter_num)
        if not filename:
            logger.warning(f"Chapter {chapter_num}: no PDF mapping defined — skipping")
            continue

        pdf_path = os.path.join(pdf_dir, filename)
        if not os.path.isfile(pdf_path):
            msg = f"Chapter {chapter_num}: PDF not found at {pdf_path}"
            logger.error(msg)
            errors.append(msg)
            continue

        chapter_id = chapter_id_map.get(chapter_num)
        if not chapter_id:
            msg = f"Chapter {chapter_num}: not in database"
            logger.error(msg)
            errors.append(msg)
            continue

        if args.dry_run:
            logger.info(f"[DRY RUN] Chapter {chapter_num} → id={chapter_id}, pdf={filename}")
            continue

        logger.info(f"\n{'='*60}")
        logger.info(f"Ingesting Chapter {chapter_num}: {filename} (id={chapter_id})")
        logger.info(f"{'='*60}")

        try:
            from scripts.ingest_pdf import ingest_pdf
            ingest_pdf(pdf_path, chapter_id)
            success.append(chapter_num)
        except Exception as exc:
            msg = f"Chapter {chapter_num} failed: {exc}"
            logger.error(msg)
            errors.append(msg)

    # Summary
    logger.info(f"\n{'='*60}")
    if args.dry_run:
        logger.info("DRY RUN complete — no changes made.")
    else:
        logger.info(f"Ingestion complete: {len(success)}/{len(chapters_to_ingest)} chapters succeeded.")
        if success:
            logger.info(f"  OK : chapters {success}")
        if errors:
            logger.error(f"  FAILED ({len(errors)}):")
            for e in errors:
                logger.error(f"    {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
