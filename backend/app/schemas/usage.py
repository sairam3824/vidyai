from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class UsageResponse(BaseModel):
    tests_generated_this_week: int
    tests_remaining: int
    weekly_limit: int
    week_start: date
    can_generate: bool
    subscription_tier: str
