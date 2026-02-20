from __future__ import annotations

import logging

import httpx
from jose import JWTError, jwk, jwt

from app.config import settings

logger = logging.getLogger(__name__)

# In-process JWKS cache — refreshed on startup or on key-not-found
_jwks_cache: dict | None = None


def _fetch_jwks() -> dict:
    """Fetch public signing keys from Supabase JWKS endpoint."""
    url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def _get_jwks(refresh: bool = False) -> dict:
    global _jwks_cache
    if _jwks_cache is None or refresh:
        _jwks_cache = _fetch_jwks()
        logger.info("JWKS refreshed (%d keys)", len(_jwks_cache.get("keys", [])))
    return _jwks_cache


def verify_supabase_token(token: str) -> dict:
    """Verify a Supabase-issued JWT using the JWKS endpoint.

    Supports both ES256 (ECC P-256, current) and HS256 (legacy shared secret).
    Automatically selects the correct public key via the token's `kid` header.
    """
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "ES256")

        jwks = _get_jwks()
        key_data = next(
            (k for k in jwks.get("keys", []) if k.get("kid") == kid),
            None,
        )

        if key_data is None:
            # Key not in cache — might be a newly rotated key, refresh once
            logger.warning("kid=%s not in JWKS cache, refreshing…", kid)
            jwks = _get_jwks(refresh=True)
            key_data = next(
                (k for k in jwks.get("keys", []) if k.get("kid") == kid),
                None,
            )

        if key_data is None:
            raise JWTError(f"Signing key not found for kid={kid}")

        public_key = jwk.construct(key_data)
        return jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            audience="authenticated",
        )

    except JWTError:
        raise
    except Exception as exc:
        raise JWTError(str(exc)) from exc
