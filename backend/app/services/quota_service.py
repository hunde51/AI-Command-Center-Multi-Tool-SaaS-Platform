from __future__ import annotations

from datetime import datetime, timezone, timedelta
from fastapi import status
from uuid import UUID

from app.repositories.subscription_repo import SubscriptionRepository


class QuotaExceededError(Exception):
    def __init__(self, message: str = "quota_exceeded") -> None:
        self.message = message
        self.status_code = status.HTTP_402_PAYMENT_REQUIRED
        super().__init__(message)


class QuotaService:
    def __init__(self, subscription_repo: SubscriptionRepository) -> None:
        self.subscription_repo = subscription_repo

    async def ensure_allowed(self, *, user_id: UUID, requested_tokens: int) -> None:
        sub = await self.subscription_repo.ensure_user_subscription(user_id=user_id)
        plan = await self.subscription_repo.get_plan(plan_id=sub.plan_id)
        if not plan:
            raise QuotaExceededError("quota_exceeded")

        now = datetime.now(timezone.utc)
        if sub.reset_date <= now:
            sub.tokens_used = 0
            sub.reset_date = now + timedelta(days=30)
            await self.subscription_repo.db.flush()

        if sub.tokens_used + max(1, requested_tokens) > int(plan.monthly_token_limit):
            raise QuotaExceededError("quota_exceeded")

    async def consume(self, *, user_id: UUID, tokens_used: int) -> None:
        sub = await self.subscription_repo.ensure_user_subscription(user_id=user_id)
        sub.tokens_used += max(0, int(tokens_used))
        await self.subscription_repo.db.flush()
