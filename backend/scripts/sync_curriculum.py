"""
Sync Curriculum Script

This script scans the `CBSC/` directory structure and automatically updates the
database to reflect the available Boards, Classes, Subjects, and Chapters (PDFs).

File Structure Assumption:
  CBSC/
    ├── Class 10/
    │     ├── Mathematics/
    │     │     ├── Real Numbers chapter 1.pdf
    │     │     ├── Polynomials chapter 2.pdf
    │     └── Science/
    │           ├── ...
    └── Class 9/
          └── ...

Run this script periodically or via a cron job to sync the filesystem state with the DB.
Usage: python backend/scripts/sync_curriculum.py
"""
import os
import sys
import re
import logging
from sqlalchemy.orm import Session

# Add backend directory to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.board import Board, Class, Subject, Chapter

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Constants
CBSC_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "CBSC"))
BOARD_NAME = "Central Board of Secondary Education"
BOARD_CODE = "CBSE"


def get_or_create_board(db: Session, name: str, code: str) -> Board:
    board = db.query(Board).filter(Board.code == code).first()
    if not board:
        logger.info(f"Creating Board: {name}")
        board = Board(name=name, code=code)
        db.add(board)
        db.commit()
        db.refresh(board)
    return board


def get_or_create_class(db: Session, board_id: int, dir_name: str) -> Class:
    # Expect directory names like "Class 10", "Class 9"
    # Extract number
    match = re.search(r'\d+', dir_name)
    class_num = int(match.group()) if match else 0
    
    # Check existing
    cls = db.query(Class).filter(
        Class.board_id == board_id, 
        Class.class_number == class_num
    ).first()
    
    if not cls:
        logger.info(f"Creating Class: {dir_name} (Number: {class_num})")
        cls = Class(
            board_id=board_id,
            class_number=class_num,
            display_name=dir_name
        )
        db.add(cls)
        db.commit()
        db.refresh(cls)
    return cls


def get_or_create_subject(db: Session, class_id: int, subject_name: str) -> Subject:
    subj = db.query(Subject).filter(
        Subject.class_id == class_id,
        Subject.subject_name == subject_name
    ).first()
    
    if not subj:
        logger.info(f"Creating Subject: {subject_name}")
        # Create a simple code, e.g., "MATH" from "Mathematics"
        code = subject_name[:4].upper()
        subj = Subject(
            class_id=class_id,
            subject_name=subject_name,
            subject_code=code
        )
        db.add(subj)
        db.commit()
        db.refresh(subj)
    return subj


def parse_chapter_info(filename: str):
    """
    Extract chapter details from filename.
    Expected formats: 
      - "Real Numbers chapter 1.pdf"
      - "Polynomials chapter 2.pdf"
      - "Probability chapter 14.pdf"
      - "Some Topic.pdf" (Fallback)
    """
    name_without_ext = os.path.splitext(filename)[0]
    
    # Regex to find "chapter X" at the end (case insensitive)
    # Examples: "Real Numbers chapter 1", "Polynomials - Chapter 2"
    match = re.search(r'(.*?)(?:[-_]\s*)?[Cc]hapter\s*(\d+)', name_without_ext)
    
    if match:
        chapter_name = match.group(1).strip().rstrip('-_').strip()
        chapter_num = int(match.group(2))
    else:
        # Fallback: Use unrelated number or just 0
        chapter_name = name_without_ext
        chapter_num = 0
        
    return chapter_name, chapter_num


def sync_chapter(db: Session, subject_id: int, filename: str):
    if not filename.lower().endswith(".pdf"):
        return

    chapter_name, chapter_num = parse_chapter_info(filename)
    
    # Check if chapter exists by number (if clearly identified) or name
    query = db.query(Chapter).filter(Chapter.subject_id == subject_id)
    
    if chapter_num > 0:
        chapter = query.filter(Chapter.chapter_number == chapter_num).first()
    else:
        chapter = query.filter(Chapter.chapter_name == chapter_name).first()

    if not chapter:
        logger.info(f"Creating Chapter: {chapter_name} (No. {chapter_num})")
        chapter = Chapter(
            subject_id=subject_id,
            chapter_number=chapter_num,
            chapter_name=chapter_name,
            description=f"Automatically imported from {filename}",
            is_active=True
        )
        db.add(chapter)
        db.commit()
    else:
        # Update name if needed (optional)
        pass


def sync_curriculum():
    logger.info(f"Starting sync from root: {CBSC_ROOT_DIR}")
    
    if not os.path.exists(CBSC_ROOT_DIR):
        logger.error(f"Directory not found: {CBSC_ROOT_DIR}")
        return

    db = SessionLocal()
    
    try:
        # 1. Ensure Board Exists
        board = get_or_create_board(db, BOARD_NAME, BOARD_CODE)
        
        # 2. Iterate Classes (Directories in CBSC root)
        for class_dir in os.listdir(CBSC_ROOT_DIR):
            class_path = os.path.join(CBSC_ROOT_DIR, class_dir)
            if not os.path.isdir(class_path) or class_dir.startswith("."):
                continue
                
            cls = get_or_create_class(db, board.id, class_dir)
            
            # 3. Iterate Subjects (Directories in Class folder)
            for subject_dir in os.listdir(class_path):
                subject_path = os.path.join(class_path, subject_dir)
                if not os.path.isdir(subject_path) or subject_dir.startswith("."):
                    continue
                    
                subj = get_or_create_subject(db, cls.id, subject_dir)
                
                # 4. Iterate Chapters (PDF files in Subject folder)
                for chapter_file in os.listdir(subject_path):
                    if chapter_file.startswith("."):
                        continue
                    sync_chapter(db, subj.id, chapter_file)
                    
        logger.info("Sync completed successfully.")

    except Exception as e:
        logger.error(f"Sync failed: {e}", exc_info=True)
    finally:
        db.close()


if __name__ == "__main__":
    sync_curriculum()
