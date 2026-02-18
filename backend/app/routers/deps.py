from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError
from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]
    return AuthService(db).get_current_user(token)
