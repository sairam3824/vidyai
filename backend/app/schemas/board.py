from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ChapterResponse(BaseModel):
    id: int
    chapter_number: int
    chapter_name: str
    description: Optional[str] = None
    is_active: bool
    chunk_count: int = 0

    model_config = {"from_attributes": True}


class TextChunkResponse(BaseModel):
    id: int
    content: str
    chunk_index: int
    page_number: Optional[int] = None
    
    model_config = {"from_attributes": True}


class ChapterContentResponse(ChapterResponse):
    text_chunks: List[TextChunkResponse] = []


class ChapterSummaryResponse(BaseModel):
    chapter_id: int
    chapter_name: str
    summary: str


class SubjectResponse(BaseModel):
    id: int
    subject_name: str
    subject_code: Optional[str] = None
    is_active: bool = True
    chapters: List[ChapterResponse] = []

    model_config = {"from_attributes": True}


class ClassResponse(BaseModel):
    id: int
    class_number: int
    display_name: str
    is_active: bool = True
    subjects: List[SubjectResponse] = []

    model_config = {"from_attributes": True}


class BoardResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True
    classes: List[ClassResponse] = []

    model_config = {"from_attributes": True}
