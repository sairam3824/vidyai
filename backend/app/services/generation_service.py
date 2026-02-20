from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import GenerationError, NotFoundError
from app.models.board import Chapter
from app.models.generated_test import GeneratedTest
from app.models.question_cache import QuestionCache
from app.models.user import Profile
from app.schemas.test import (
    AnswerDetail,
    GenerateTestRequest,
    GeneratedTestResponse,
    SubmitTestResponse,
)
from app.services.rag_service import RAGService
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)

_MCQ_SYSTEM_PROMPT = """\
You are an expert CBSE curriculum question setter.
Generate exactly <<NUM_QUESTIONS>> multiple-choice questions (MCQs) based strictly on the provided chapter content.

Rules:
- Each question must have exactly 4 options labelled A, B, C, D.
- Only one correct answer per question.
- Include a concise explanation (1-2 sentences) for the correct answer.
- Vary difficulty: mix easy (30%), medium (50%), hard (20%).
- Questions must be factually accurate and grounded in the provided context.
- Return ONLY valid JSON — no markdown fences, no extra text.

Output schema:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": [
        {"key": "A", "text": "Option A"},
        {"key": "B", "text": "Option B"},
        {"key": "C", "text": "Option C"},
        {"key": "D", "text": "Option D"}
      ],
      "correct_answer": "A",
      "explanation": "Brief explanation."
    }
  ]
}
"""


class GenerationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.rag = RAGService(db)
        self.usage = UsageService(db)
        self._client: OpenAI | None = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    # ── Generate ─────────────────────────────────────────────────────────

    def generate_test(
        self, request: GenerateTestRequest, user: Profile
    ) -> GeneratedTestResponse:
        chapter = self.db.query(Chapter).filter(Chapter.id == request.chapter_id).first()
        if not chapter:
            raise NotFoundError("Chapter")

        # Enforce usage limit first (raises on exceeded)
        self.usage.check_and_increment(user)

        # ── Strategy 1: DB question cache ─────────────────────────────────
        # Check if a valid cached question set exists for this
        # (chapter, num_questions) pair — shared across all users.
        questions_json = self._get_cached_questions(
            chapter.id, request.num_questions
        )

        if questions_json is not None:
            logger.info(
                "Question cache HIT: chapter=%d num_q=%d — skipping OpenAI",
                chapter.id,
                request.num_questions,
            )
        else:
            logger.info(
                "Question cache MISS: chapter=%d num_q=%d — generating",
                chapter.id,
                request.num_questions,
            )

            try:
                embedded_chunks = self.rag.ensure_chapter_embeddings(
                    chapter_id=chapter.id,
                    pdf_s3_key=chapter.pdf_s3_key,
                )
            except Exception as exc:
                logger.error(
                    "Failed to auto-generate embeddings for chapter %d: %s",
                    chapter.id,
                    exc,
                    exc_info=True,
                )
                raise GenerationError(
                    "Failed to prepare chapter embeddings. Please retry."
                )

            if embedded_chunks == 0:
                raise GenerationError(
                    "No embeddings found for this chapter. Please upload/reprocess the chapter PDF first."
                )
            if chapter.status != "ready" or chapter.error_message:
                chapter.status = "ready"
                chapter.error_message = None

            # ── Strategy 2: Redis RAG context cache ───────────────────────
            # retrieve_context() caches the embedding + vector search result
            # in Redis, skipping the OpenAI embed call on subsequent requests.
            rag_query = (
                f"Key concepts, theorems, formulas and important topics "
                f"in {chapter.chapter_name}"
            )
            context = self.rag.retrieve_context(chapter.id, rag_query)
            if not context:
                raise GenerationError(
                    "Failed to retrieve chapter context from embeddings. Please retry."
                )

            questions_json = self._call_openai(
                context=context,
                chapter_name=chapter.chapter_name,
                num_questions=request.num_questions,
            )

            # Store in DB question cache for future requests
            self._store_cached_questions(chapter.id, request.num_questions, questions_json)

        # Always create a per-user GeneratedTest record (for score tracking)
        test = GeneratedTest(
            user_id=user.id,
            chapter_id=chapter.id,
            questions_json=questions_json,
        )
        self.db.add(test)
        self.db.commit()
        self.db.refresh(test)

        return self._to_response(test, chapter.chapter_name, chapter.subject.subject_name)

    # ── Read ─────────────────────────────────────────────────────────────

    def get_test(self, test_id: int, user_id: int) -> GeneratedTestResponse:
        test = self._get_owned_test(test_id, user_id)
        chapter_name = test.chapter.chapter_name if test.chapter else None
        subject_name = (
            test.chapter.subject.subject_name if test.chapter else None
        )
        return self._to_response(test, chapter_name, subject_name)

    def list_tests(
        self, user_id: int, skip: int = 0, limit: int = 20
    ) -> List[GeneratedTestResponse]:
        tests = (
            self.db.query(GeneratedTest)
            .filter(GeneratedTest.user_id == user_id)
            .order_by(GeneratedTest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [
            self._to_response(
                t,
                t.chapter.chapter_name if t.chapter else None,
                t.chapter.subject.subject_name if t.chapter else None,
            )
            for t in tests
        ]

    # ── Submit ────────────────────────────────────────────────────────────

    def submit_test(
        self, test_id: int, user_id: int, answers: Dict[str, str]
    ) -> SubmitTestResponse:
        test = self._get_owned_test(test_id, user_id)

        questions = test.questions_json.get("questions", [])
        correct_count = 0
        details: List[AnswerDetail] = []

        for q in questions:
            q_id = str(q["id"])
            user_answer = answers.get(q_id)
            is_correct = user_answer == q["correct_answer"]
            if is_correct:
                correct_count += 1
            details.append(
                AnswerDetail(
                    question_id=q["id"],
                    question=q["question"],
                    user_answer=user_answer,
                    correct_answer=q["correct_answer"],
                    is_correct=is_correct,
                    explanation=q.get("explanation", ""),
                )
            )

        total = len(questions)
        score = round((correct_count / total * 100) if total else 0, 2)
        test.score = score
        test.completed_at = datetime.now(timezone.utc)
        self.db.commit()

        return SubmitTestResponse(
            test_id=test_id,
            score=score,
            total_questions=total,
            correct_answers=correct_count,
            details=details,
        )

    # ── Question cache helpers ─────────────────────────────────────────────

    def _get_cached_questions(
        self, chapter_id: int, num_questions: int
    ) -> Dict[str, Any] | None:
        """Return questions_json from DB cache if a non-expired entry exists."""
        now = datetime.now(timezone.utc)
        entry = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.chapter_id == chapter_id,
                QuestionCache.num_questions == num_questions,
                QuestionCache.expires_at > now,
            )
            .first()
        )
        return entry.questions_json if entry else None

    def _store_cached_questions(
        self, chapter_id: int, num_questions: int, questions_json: Dict[str, Any]
    ) -> None:
        """Upsert a question cache entry with a fresh TTL."""
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=settings.CACHE_TTL_SECONDS
        )
        existing = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.chapter_id == chapter_id,
                QuestionCache.num_questions == num_questions,
            )
            .first()
        )
        if existing:
            existing.questions_json = questions_json
            existing.expires_at = expires_at
        else:
            self.db.add(
                QuestionCache(
                    chapter_id=chapter_id,
                    num_questions=num_questions,
                    questions_json=questions_json,
                    expires_at=expires_at,
                )
            )
        try:
            self.db.commit()
        except Exception as exc:
            # Race condition: another request inserted simultaneously — harmless
            self.db.rollback()
            logger.warning("Question cache upsert skipped (race condition): %s", exc)

    # ── Helpers ───────────────────────────────────────────────────────────

    def _call_openai(
        self,
        context: str,
        chapter_name: str,
        num_questions: int,
    ) -> Dict[str, Any]:
        # Avoid str.format here because prompt contains literal JSON braces.
        system_msg = _MCQ_SYSTEM_PROMPT.replace("<<NUM_QUESTIONS>>", str(num_questions))
        user_msg = (
            f"Chapter: {chapter_name}\n\n"
            f"Content:\n{context}\n\n"
            f"Generate {num_questions} MCQ questions based on the above content."
        )
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.7,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError as exc:
            logger.error(f"JSON parse error from OpenAI: {exc}")
            raise GenerationError("Failed to parse AI-generated questions")
        except Exception as exc:
            logger.error(f"OpenAI API error: {exc}", exc_info=True)
            raise GenerationError(f"AI generation failed: {exc}")

    def _get_owned_test(self, test_id: int, user_id: int) -> GeneratedTest:
        test = (
            self.db.query(GeneratedTest)
            .filter(
                GeneratedTest.id == test_id,
                GeneratedTest.user_id == user_id,
            )
            .first()
        )
        if not test:
            raise NotFoundError("Test")
        return test

    @staticmethod
    def _to_response(
        test: GeneratedTest,
        chapter_name: str | None,
        subject_name: str | None,
    ) -> GeneratedTestResponse:
        return GeneratedTestResponse(
            id=test.id,
            chapter_id=test.chapter_id,
            chapter_name=chapter_name,
            subject_name=subject_name,
            questions_json=test.questions_json,
            score=test.score,
            completed_at=test.completed_at,
            created_at=test.created_at,
        )
