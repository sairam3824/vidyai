from __future__ import annotations

from fastapi import HTTPException, status


class AppException(HTTPException):
    pass


class AuthenticationError(AppException):
    def __init__(self, detail: str = "Could not validate credentials") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class AuthorizationError(AppException):
    def __init__(self, detail: str = "Not enough permissions") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found",
        )


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class UsageLimitError(AppException):
    def __init__(self, detail: str = "Weekly test generation limit reached") -> None:
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


class GenerationError(AppException):
    def __init__(self, detail: str = "Failed to generate content") -> None:
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)
