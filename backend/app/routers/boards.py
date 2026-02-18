from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.board import Board, Class, Subject
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.board import BoardResponse

router = APIRouter(prefix="/boards", tags=["Curriculum"])


@router.get("", response_model=List[BoardResponse])
def list_boards(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[Board]:
    """Return the full curriculum hierarchy: boards → classes → subjects → chapters."""
    return (
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
