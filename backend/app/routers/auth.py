from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Profile
from app.routers.deps import get_current_user
from app.schemas.auth import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=ProfileResponse)
def me(
    response: Response,
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """Return the currently authenticated user's profile."""
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["Pragma"] = "no-cache"
    return current_user


@router.patch("/me", response_model=ProfileResponse)
def update_me(
    data: ProfileUpdateRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Profile:
    """Update the current user's profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user
