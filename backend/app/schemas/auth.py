from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: str
    email: Optional[str]
    full_name: Optional[str]
    subscription_tier: str
    is_admin: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
