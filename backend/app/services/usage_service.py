from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import UsageLimitError
from app.models.usage_tracking import UsageTracking
from app.models.user import SubscriptionTier, User
from app.schemas.usage import UsageResponse

logger = logging.getLogger(__name__)


def _iso_week_start(d: date | None = None) -> date:
    """Return the ISO Monday of the week containing *d* (default: today)."""
    d = d or date.today()
    return d - timedelta(days=d.weekday())


# Tier → weekly test limit mapping (single source of truth)
TIER_LIMITS: dict[SubscriptionTier, int] = {
    SubscriptionTier.FREE: settings.FREE_TESTS_PER_WEEK,
    SubscriptionTier.BASIC: settings.BASIC_TESTS_PER_WEEK,
    SubscriptionTier.PREMIUM: settings.PREMIUM_TESTS_PER_WEEK,
    SubscriptionTier.ENTERPRISE: 999_999,
}


class UsageService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_usage(self, user_id: int) -> UsageTracking:
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

    def check_and_increment(self, user: User) -> None:
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

    def get_usage_status(self, user: User) -> UsageResponse:
        limit = TIER_LIMITS.get(user.subscription_tier, settings.FREE_TESTS_PER_WEEK)
        record = self.get_or_create_usage(user.id)
        remaining = max(0, limit - record.tests_generated)
        return UsageResponse(
            tests_generated_this_week=record.tests_generated,
            tests_remaining=remaining,
            weekly_limit=limit,
            week_start=record.week_start,
            can_generate=remaining > 0,
            subscription_tier=user.subscription_tier.value,
        )
