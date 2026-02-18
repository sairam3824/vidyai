from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.test import (
    GenerateTestRequest,
    GeneratedTestResponse,
    SubmitTestRequest,
    SubmitTestResponse,
)
from app.services.generation_service import GenerationService

router = APIRouter(prefix="/tests", tags=["Tests"])


@router.post("/generate", response_model=GeneratedTestResponse, status_code=201)
def generate_test(
    request: GenerateTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeneratedTestResponse:
    """Generate a new MCQ test via RAG + OpenAI."""
    return GenerationService(db).generate_test(request, current_user)


@router.get("", response_model=List[GeneratedTestResponse])
def list_tests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[GeneratedTestResponse]:
    """List all tests for the authenticated user."""
    return GenerationService(db).list_tests(current_user.id, skip=skip, limit=limit)


@router.get("/{test_id}", response_model=GeneratedTestResponse)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeneratedTestResponse:
    """Retrieve a single test (must belong to the user)."""
    return GenerationService(db).get_test(test_id, current_user.id)


@router.post("/{test_id}/submit", response_model=SubmitTestResponse)
def submit_test(
    test_id: int,
    request: SubmitTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubmitTestResponse:
    """Submit answers, calculate score, and persist result."""
    return GenerationService(db).submit_test(test_id, current_user.id, request.answers)
