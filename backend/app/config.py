from __future__ import annotations

import json
from functools import lru_cache
from typing import Any, List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Vidyai"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Database (Supabase PostgreSQL) ────────────────────────────────────────
    DATABASE_URL: str  # postgresql://postgres.[ref]:[password]@[host]:5432/postgres

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    # JWT secret only needed if using legacy HS256 signing — not required for ECC (P-256)
    SUPABASE_JWT_SECRET: Optional[str] = None

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o"
    EMBEDDING_DIMENSIONS: int = 1536
    RAG_TOP_K: int = 6

    # ── Cache ────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 604800       # 7 days

    # ── Storage (AWS S3 for PDFs) ─────────────────────────────────────────────
    STORAGE_MODE: str = "s3"             # "local" | "s3"
    LOCAL_STORAGE_PATH: str = "./storage"

    # ── AWS ──────────────────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: Optional[str] = None

    # ── Usage / Limits ───────────────────────────────────────────────────────
    FREE_TESTS_PER_WEEK: int = 3
    BASIC_TESTS_PER_WEEK: int = 20
    PREMIUM_TESTS_PER_WEEK: int = 100

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 200
    RATE_LIMIT_WINDOW_SECONDS: int = 3600

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_ORIGIN_REGEX: Optional[str] = None

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> List[str]:
        """Support both JSON array and comma-separated origin lists."""
        if value is None:
            return []

        if isinstance(value, list):
            return [str(origin).strip() for origin in value if str(origin).strip()]

        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []

            if text.startswith("["):
                try:
                    parsed = json.loads(text)
                except json.JSONDecodeError:
                    parsed = None
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]

            return [origin.strip() for origin in text.split(",") if origin.strip()]

        raise ValueError("ALLOWED_ORIGINS must be a list or comma-separated string")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
