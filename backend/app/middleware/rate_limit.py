from __future__ import annotations

import time
from collections import defaultdict
from typing import DefaultDict, List

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-process sliding-window rate limiter keyed by client IP.
    Replace with Redis-backed limiter for multi-instance deployments.
    """

    def __init__(
        self,
        app,
        max_requests: int = settings.RATE_LIMIT_REQUESTS,
        window_seconds: int = settings.RATE_LIMIT_WINDOW_SECONDS,
    ) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window_seconds
        self._log: DefaultDict[str, List[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        # Use proxy headers when present so each real user gets an independent bucket.
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
            if ip:
                return ip

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            ip = real_ip.strip()
            if ip:
                return ip

        cf_ip = request.headers.get("cf-connecting-ip")
        if cf_ip:
            ip = cf_ip.strip()
            if ip:
                return ip

        return (request.client.host if request.client else None) or "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        # CORS preflight should never be throttled.
        if request.method == "OPTIONS":
            return await call_next(request)

        ip = self._get_client_ip(request)
        now = time.monotonic()
        cutoff = now - self.window

        # Prune stale timestamps
        self._log[ip] = [t for t in self._log[ip] if t > cutoff]

        if len(self._log[ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please slow down."},
            )

        self._log[ip].append(now)
        return await call_next(request)
