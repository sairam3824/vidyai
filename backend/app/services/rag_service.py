from __future__ import annotations

import io
import logging
from typing import Any, List

from openai import OpenAI
from pypdf import PdfReader
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models.text_chunk import TextChunk
from app.services.cache_service import cache
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)

CHUNK_SIZE = 900
CHUNK_OVERLAP = 100
EMBED_BATCH_SIZE = 20


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

    # ── Embedding readiness ───────────────────────────────────────────────

    def ensure_chapter_embeddings(
        self,
        chapter_id: int,
        pdf_s3_key: str | None,
    ) -> int:
        """Ensure chapter embeddings exist before retrieval.

        Strategy:
        1) If chunks exist but some/all embeddings are missing, backfill those rows.
        2) If no chunks exist, download chapter PDF, chunk it, embed it, and store.
        """
        total_chunks = self._count_chunks(chapter_id)
        embedded_chunks = self._count_chunks(chapter_id, embedded_only=True)

        if total_chunks > 0 and embedded_chunks == total_chunks:
            return embedded_chunks

        if total_chunks > 0 and embedded_chunks < total_chunks:
            missing_chunks = (
                self.db.query(TextChunk)
                .filter(TextChunk.chapter_id == chapter_id, TextChunk.embedding.is_(None))
                .order_by(TextChunk.chunk_index.asc())
                .all()
            )
            if missing_chunks:
                logger.info(
                    "RAG: chapter %d has %d/%d embeddings; backfilling %d missing rows",
                    chapter_id,
                    embedded_chunks,
                    total_chunks,
                    len(missing_chunks),
                )
                self._embed_existing_chunks(chapter_id, missing_chunks)
            return self._count_chunks(chapter_id, embedded_only=True)

        if not pdf_s3_key:
            logger.warning(
                "RAG: chapter %d has no chunks and no source PDF key; cannot auto-generate embeddings",
                chapter_id,
            )
            return 0

        logger.info(
            "RAG: chapter %d has no chunks; generating embeddings from source PDF %s",
            chapter_id,
            pdf_s3_key,
        )
        return self._ingest_chunks_from_pdf(chapter_id, pdf_s3_key)

    def _count_chunks(self, chapter_id: int, embedded_only: bool = False) -> int:
        query = self.db.query(func.count(TextChunk.id)).filter(
            TextChunk.chapter_id == chapter_id
        )
        if embedded_only:
            query = query.filter(TextChunk.embedding.isnot(None))
        return int(query.scalar() or 0)

    def _embed_existing_chunks(self, chapter_id: int, chunks: List[TextChunk]) -> None:
        for i in range(0, len(chunks), EMBED_BATCH_SIZE):
            batch = chunks[i : i + EMBED_BATCH_SIZE]
            texts = [chunk.content for chunk in batch]
            embeddings = self.embed_batch(texts)
            for chunk, embedding in zip(batch, embeddings):
                chunk.embedding = embedding
            self.db.commit()

        logger.info(
            "RAG: chapter %d backfilled embeddings for %d chunks",
            chapter_id,
            len(chunks),
        )

    def _ingest_chunks_from_pdf(self, chapter_id: int, pdf_s3_key: str) -> int:
        try:
            pdf_bytes = storage_service.download(pdf_s3_key)
            all_chunks = self._extract_pdf_chunks(pdf_bytes)
            if not all_chunks:
                logger.warning(
                    "RAG: chapter %d PDF produced no text chunks during on-demand ingestion",
                    chapter_id,
                )
                return 0

            self.db.query(TextChunk).filter(TextChunk.chapter_id == chapter_id).delete()
            self.db.commit()

            for i in range(0, len(all_chunks), EMBED_BATCH_SIZE):
                batch = all_chunks[i : i + EMBED_BATCH_SIZE]
                texts = [chunk["content"] for chunk in batch]
                embeddings = self.embed_batch(texts)
                for chunk, embedding in zip(batch, embeddings):
                    self.db.add(
                        TextChunk(
                            chapter_id=chapter_id,
                            content=chunk["content"],
                            chunk_index=chunk["chunk_index"],
                            page_number=chunk["page_number"],
                            embedding=embedding,
                        )
                    )
                self.db.commit()

            logger.info(
                "RAG: chapter %d on-demand ingestion stored %d embedded chunks",
                chapter_id,
                len(all_chunks),
            )
            return len(all_chunks)
        except Exception:
            self.db.rollback()
            logger.exception(
                "RAG: chapter %d failed on-demand embedding ingestion", chapter_id
            )
            raise

    @staticmethod
    def _extract_pdf_chunks(pdf_bytes: bytes) -> List[dict[str, Any]]:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        all_chunks: List[dict[str, Any]] = []

        for page_num, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if not text:
                continue

            start = 0
            while start < len(text):
                chunk_text = text[start : start + CHUNK_SIZE].strip()
                if chunk_text:
                    all_chunks.append(
                        {
                            "content": chunk_text,
                            "page_number": page_num + 1,
                            "chunk_index": len(all_chunks),
                        }
                    )
                start += CHUNK_SIZE - CHUNK_OVERLAP

        return all_chunks

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
