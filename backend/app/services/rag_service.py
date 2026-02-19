from __future__ import annotations

import logging
from typing import List

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.models.text_chunk import TextChunk
from app.services.cache_service import cache

logger = logging.getLogger(__name__)


class RAGService:
    """Retrieval-Augmented Generation: embed query → fetch similar chunks.

    retrieve_context() is the recommended entry point — it caches the built
    context string in Redis so repeated calls for the same chapter skip both
    the OpenAI embedding call and the pgvector similarity search.
    """

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

    # ── Cached context (preferred entry point) ────────────────────────────

    def retrieve_context(self, chapter_id: int, query: str) -> str:
        """Return the RAG context string, using Redis cache when available.

        Cache key: rag_ctx:{chapter_id}:{md5(query)}
        TTL      : settings.CACHE_TTL_SECONDS (default 7 days)

        On a cache hit the OpenAI embedding API and pgvector search are
        both skipped entirely, reducing latency and API cost.
        """
        cache_key = cache.rag_context_key(chapter_id, query)

        cached_context = cache.get(cache_key)
        if cached_context is not None:
            logger.info("RAG cache HIT for chapter %d", chapter_id)
            return cached_context

        logger.info("RAG cache MISS for chapter %d — fetching from DB", chapter_id)
        chunks = self.retrieve(chapter_id, query)
        context = self.build_context(chunks) if chunks else ""

        if context:
            cache.set(cache_key, context)

        return context

    # ── Context builder ───────────────────────────────────────────────────

    @staticmethod
    def build_context(chunks: List[TextChunk]) -> str:
        return "\n\n---\n\n".join(
            f"[Chunk {i + 1}]\n{chunk.content}" for i, chunk in enumerate(chunks)
        )
