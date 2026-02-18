from __future__ import annotations

import logging
from typing import List

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.models.text_chunk import TextChunk

logger = logging.getLogger(__name__)


class RAGService:
    """Retrieval-Augmented Generation: embed query → fetch similar chunks."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._client: OpenAI | None = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    # ── Embedding ─────────────────────────────────────────────────────────

    def embed(self, text: str) -> List[float]:
        response = self.client.embeddings.create(
            input=text,
            model=settings.OPENAI_EMBEDDING_MODEL,
        )
        return response.data[0].embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        response = self.client.embeddings.create(
            input=texts,
            model=settings.OPENAI_EMBEDDING_MODEL,
        )
        return [item.embedding for item in response.data]

    # ── Retrieval ─────────────────────────────────────────────────────────

    def retrieve(
        self,
        chapter_id: int,
        query: str,
        top_k: int | None = None,
    ) -> List[TextChunk]:
        top_k = top_k or settings.RAG_TOP_K
        query_embedding = self.embed(query)

        results = (
            self.db.query(TextChunk)
            .filter(TextChunk.chapter_id == chapter_id)
            .filter(TextChunk.embedding.isnot(None))
            .order_by(TextChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
            .all()
        )
        logger.info(f"RAG: retrieved {len(results)} chunks for chapter {chapter_id}")
        return results

    # ── Context builder ───────────────────────────────────────────────────

    @staticmethod
    def build_context(chunks: List[TextChunk]) -> str:
        return "\n\n---\n\n".join(
            f"[Chunk {i + 1}]\n{chunk.content}" for i, chunk in enumerate(chunks)
        )
