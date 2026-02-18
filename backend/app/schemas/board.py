from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ChapterResponse(BaseModel):
    id: int
    chapter_number: int
    chapter_name: str
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class SubjectResponse(BaseModel):
    id: int
    subject_name: str
    subject_code: Optional[str] = None
    chapters: List[ChapterResponse] = []

    model_config = {"from_attributes": True}


class ClassResponse(BaseModel):
    id: int
    class_number: int
    display_name: str
    subjects: List[SubjectResponse] = []

    model_config = {"from_attributes": True}


class BoardResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    classes: List[ClassResponse] = []

    model_config = {"from_attributes": True}
