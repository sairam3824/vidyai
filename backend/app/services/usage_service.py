from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import UsageLimitError
from app.models.usage_tracking import UsageTracking
from app.models.user import Profile
from app.schemas.usage import UsageResponse

logger = logging.getLogger(__name__)

TIER_LIMITS: dict[str, int] = {
    "free": settings.FREE_TESTS_PER_WEEK,
    "basic": settings.BASIC_TESTS_PER_WEEK,
    "premium": settings.PREMIUM_TESTS_PER_WEEK,
    "enterprise": 999_999,
}


def _iso_week_start(d: date | None = None) -> date:
    """Return the ISO Monday of the week containing *d* (default: today)."""
    d = d or date.today()
    return d - timedelta(days=d.weekday())


class UsageService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_usage(self, user_id) -> UsageTracking:
        week_start = _iso_week_start()
        record = (
            self.db.query(UsageTracking)
            .filter(
                UsageTracking.user_id == user_id,
                UsageTracking.week_start == week_start,
            )
            .first()
        )
        if not record:
            record = UsageTracking(
                user_id=user_id,
                week_start=week_start,
                tests_generated=0,
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        return record

    def check_and_increment(self, user: Profile) -> None:
        """Raises UsageLimitError if limit reached; otherwise increments counter."""
        limit = TIER_LIMITS.get(user.subscription_tier, settings.FREE_TESTS_PER_WEEK)
        record = self.get_or_create_usage(user.id)

        if record.tests_generated >= limit:
            raise UsageLimitError(
                f"You have used all {limit} free tests this week. "
                "Upgrade your plan to unlock more."
            )

        record.tests_generated += 1
        self.db.commit()
        logger.info(
            f"User {user.id} generated test #{record.tests_generated}/{limit} this week"
        )

    def get_usage_status(self, user: Profile) -> UsageResponse:
        limit = TIER_LIMITS.get(user.subscription_tier, settings.FREE_TESTS_PER_WEEK)
        record = self.get_or_create_usage(user.id)
        remaining = max(0, limit - record.tests_generated)
        return UsageResponse(
            tests_generated_this_week=record.tests_generated,
            tests_remaining=remaining,
            weekly_limit=limit,
            week_start=record.week_start,
            can_generate=remaining > 0,
            subscription_tier=user.subscription_tier,
        )
