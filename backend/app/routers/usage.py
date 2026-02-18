from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.usage import UsageResponse
from app.services.usage_service import UsageService

router = APIRouter(prefix="/usage", tags=["Usage"])


@router.get("", response_model=UsageResponse)
def get_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UsageResponse:
    """Return weekly usage stats for the authenticated user."""
    return UsageService(db).get_usage_status(current_user)
