from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import SubscriptionPlan, UserSubscription


class SubscriptionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_default_plan(self) -> SubscriptionPlan | None:
        result = await self.db.execute(
            select(SubscriptionPlan)
            .order_by(SubscriptionPlan.monthly_token_limit.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_plans(self) -> list[SubscriptionPlan]:
        result = await self.db.execute(
            select(SubscriptionPlan).order_by(
                SubscriptionPlan.price.asc(),
                SubscriptionPlan.monthly_token_limit.asc(),
            )
        )
        return list(result.scalars().all())

    async def get_user_subscription(self, *, user_id: UUID) -> UserSubscription | None:
        result = await self.db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
        return result.scalar_one_or_none()

    async def ensure_user_subscription(self, *, user_id: UUID) -> UserSubscription:
        existing = await self.get_user_subscription(user_id=user_id)
        if existing:
            return existing

        plan = await self.get_default_plan()
        if not plan:
            raise ValueError("No subscription plan configured")

        row = UserSubscription(
            user_id=user_id,
            plan_id=plan.id,
            tokens_used=0,
            reset_date=datetime.now(timezone.utc) + timedelta(days=30),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def get_plan(self, *, plan_id: UUID) -> SubscriptionPlan | None:
        result = await self.db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
        return result.scalar_one_or_none()
