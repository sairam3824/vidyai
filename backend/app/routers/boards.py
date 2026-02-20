from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.board import Board, Class, Subject, Chapter
from app.models.text_chunk import TextChunk
from app.models.user import Profile
from app.routers.deps import get_current_user
from app.schemas.board import BoardResponse, ChapterContentResponse

router = APIRouter(prefix="/boards", tags=["Curriculum"])


def _build_board_response(board: Board, chunk_counts: dict[int, int]) -> dict:
    """Serialize a Board ORM object to a dict, injecting per-chapter chunk_count."""
    return {
        "id": board.id,
        "name": board.name,
        "code": board.code,
        "description": board.description,
        "is_active": board.is_active,
        "classes": [
            {
                "id": cls.id,
                "class_number": cls.class_number,
                "display_name": cls.display_name,
                "is_active": cls.is_active,
                "subjects": [
                    {
                        "id": subj.id,
                        "subject_name": subj.subject_name,
                        "subject_code": subj.subject_code,
                        "is_active": subj.is_active,
                        "chapters": [
                            {
                                "id": ch.id,
                                "chapter_number": ch.chapter_number,
                                "chapter_name": ch.chapter_name,
                                "description": ch.description,
                                "is_active": ch.is_active,
                                "status": ch.status,
                                "chunk_count": chunk_counts.get(ch.id, 0),
                            }
                            for ch in subj.chapters
                        ],
                    }
                    for subj in cls.subjects
                ],
            }
            for cls in board.classes
        ],
    }


@router.get("", response_model=List[BoardResponse])
def list_boards(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> list[dict]:
    """Return the full curriculum hierarchy: boards → classes → subjects → chapters.

    Each chapter includes ``chunk_count`` — the number of embedded text chunks
    ingested from the PDF. The frontend uses this to indicate which chapters are
    test-ready (chunk_count > 0).
    """
    boards = (
        db.query(Board)
        .options(
            selectinload(Board.classes)
            .selectinload(Class.subjects)
            .selectinload(Subject.chapters)
        )
        .filter(Board.is_active.is_(True))
        .order_by(Board.name)
        .all()
    )

    # Single aggregate query — {chapter_id: chunk_count}
    chunk_counts: dict[int, int] = dict(
        db.query(TextChunk.chapter_id, func.count(TextChunk.id))
        .group_by(TextChunk.chapter_id)
        .all()
    )

    return [_build_board_response(b, chunk_counts) for b in boards]


@router.get("/chapters/{chapter_id}", response_model=ChapterContentResponse)
def get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> Chapter:
    """Get detailed chapter content including text chunks."""
    from app.models.board import Chapter
    from app.models.text_chunk import TextChunk

    chapter = (
        db.query(Chapter)
        .options(
            selectinload(Chapter.text_chunks),
            selectinload(Chapter.subject).selectinload(Subject.class_),
        )
        .filter(Chapter.id == chapter_id)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    return chapter
