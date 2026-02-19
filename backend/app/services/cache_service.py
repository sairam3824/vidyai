from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Optional

import redis

from app.config import settings

logger = logging.getLogger(__name__)

_CACHE_MISS = object()  # sentinel distinct from None


class CacheService:
    """Thin Redis wrapper with JSON serialisation and graceful degradation.

    All methods swallow Redis errors and log a warning — a cache failure
    must never break the main request path.
    """

    def __init__(self) -> None:
        self._client: Optional[redis.Redis] = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
        return self._client

    # ── Core operations ───────────────────────────────────────────────────

    def get(self, key: str) -> Any:
        """Return the cached value, or None on miss/error."""
        try:
            raw = self.client.get(key)
            if raw is not None:
                return json.loads(raw)
        except Exception as exc:
            logger.warning("Cache GET error for key=%s: %s", key, exc)
        return None

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Store value as JSON with optional TTL (seconds). Defaults to CACHE_TTL_SECONDS."""
        ttl = ttl if ttl is not None else settings.CACHE_TTL_SECONDS
        try:
            self.client.setex(key, ttl, json.dumps(value))
        except Exception as exc:
            logger.warning("Cache SET error for key=%s: %s", key, exc)

    def delete(self, key: str) -> None:
        try:
            self.client.delete(key)
        except Exception as exc:
            logger.warning("Cache DELETE error for key=%s: %s", key, exc)

    # ── Key helpers ───────────────────────────────────────────────────────

    @staticmethod
    def make_key(*parts: Any) -> str:
        """Stable MD5 hash of colon-joined string parts."""
        raw = ":".join(str(p) for p in parts)
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def rag_context_key(chapter_id: int, query: str) -> str:
        h = hashlib.md5(query.encode()).hexdigest()
        return f"rag_ctx:{chapter_id}:{h}"

    @staticmethod
    def ping() -> bool:
        """Return True if Redis is reachable."""
        try:
            return cache._client is not None and cache._client.ping()
        except Exception:
            return False


# Module-level singleton — import this everywhere
cache = CacheService()
