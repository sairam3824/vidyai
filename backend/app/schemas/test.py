from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class GenerateTestRequest(BaseModel):
    chapter_id: int
    num_questions: int = Field(default=10, ge=5, le=20)


class MCQOption(BaseModel):
    key: str   # "A" | "B" | "C" | "D"
    text: str


class MCQQuestion(BaseModel):
    id: int
    question: str
    options: List[MCQOption]
    correct_answer: str
    explanation: str


class TestQuestionsPayload(BaseModel):
    questions: List[MCQQuestion]


class GeneratedTestResponse(BaseModel):
    id: int
    chapter_id: Optional[int] = None
    chapter_name: Optional[str] = None
    subject_name: Optional[str] = None
    questions_json: Dict[str, Any]
    score: Optional[float] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmitTestRequest(BaseModel):
    answers: Dict[str, str]   # {"1": "A", "2": "C", ...}


class AnswerDetail(BaseModel):
    question_id: int
    question: str
    user_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: str


class SubmitTestResponse(BaseModel):
    test_id: int
    score: float
    total_questions: int
    correct_answers: int
    details: List[AnswerDetail]
