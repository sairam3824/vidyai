from __future__ import annotations

import logging

from jose import JWTError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Public API ────────────────────────────────────────────────────────

    def register(self, data: RegisterRequest) -> TokenResponse:
        if self.db.query(User).filter(User.email == data.email).first():
            raise ConflictError("Email already registered")

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"Registered new user id={user.id} email={user.email}")
        return self._build_token_response(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")
        logger.info(f"User id={user.id} logged in")
        return self._build_token_response(user)

    def get_current_user(self, token: str) -> User:
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise AuthenticationError()
            user_id = payload.get("sub")
            if user_id is None:
                raise AuthenticationError()
        except JWTError:
            raise AuthenticationError()

        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise AuthenticationError()
        return user

    # ── Private helpers ───────────────────────────────────────────────────

    def _build_token_response(self, user: User) -> TokenResponse:
        access_token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )
