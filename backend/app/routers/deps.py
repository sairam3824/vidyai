from __future__ import annotations

from typing import Optional

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import verify_supabase_token
from app.database import get_db
from app.models.user import Profile


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Profile:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]

    try:
        payload = verify_supabase_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")
    except JWTError:
        raise AuthenticationError("Invalid or expired token")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile or not profile.is_active:
        raise AuthenticationError("User not found or inactive")
    return profile


def get_admin_user(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    if not current_user.is_admin:
        raise AuthorizationError("Admin access required")
    return current_user
