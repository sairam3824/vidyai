from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Profile
from app.routers.deps import get_admin_user
from app.schemas.auth import ProfileResponse
from app.services.admin_service import AdminService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Users ─────────────────────────────────────────────────────────────────────


@router.get("/users", response_model=List[ProfileResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    admin: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> List[Profile]:
    """List all users (admin only)."""
    return AdminService(db).list_users(skip=skip, limit=limit)


@router.patch("/users/{user_id}/tier")
def update_user_tier(
    user_id: str,
    tier: str,
    admin: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """Update a user's subscription tier (admin only)."""
    return AdminService(db).update_user_tier(user_id, tier)


# ── Chapters ──────────────────────────────────────────────────────────────────


@router.get("/chapters")
def list_chapters(
    admin: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List all chapters with ingestion status (admin only)."""
    return AdminService(db).list_chapters()


# ── PDF Upload ────────────────────────────────────────────────────────────────


@router.post("/upload", status_code=202)
async def upload_pdf(
    board_name: str = Form(...),
    class_number: int = Form(...),
    subject_name: str = Form(...),
    chapter_name: str = Form(...),
    chapter_number: int = Form(...),
    file: UploadFile = File(...),
    admin: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Upload a PDF and enqueue embedding generation (admin only).

    Returns immediately with a job_id. Poll /admin/jobs/{job_id} for status.
    """
    file_bytes = await file.read()
    return AdminService(db).upload_pdf_and_enqueue(
        file_bytes=file_bytes,
        filename=file.filename or "upload.pdf",
        board_name=board_name,
        class_number=class_number,
        subject_name=subject_name,
        chapter_name=chapter_name,
        chapter_number=chapter_number,
    )


# ── Job Status ────────────────────────────────────────────────────────────────


@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: str,
    admin: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Poll ingestion job status (admin only)."""
    job = AdminService(db).get_job_status(job_id)
    return {
        "id": str(job.id),
        "chapter_id": job.chapter_id,
        "status": job.status,
        "error_message": job.error_message,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "created_at": job.created_at,
    }
