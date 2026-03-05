from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage_log import UsageLog


class UsageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log_usage(
        self,
        *,
        user_id: UUID,
        model_used: str,
        tokens_used: int,
        cost_estimate: float,
    ) -> UsageLog:
        usage = UsageLog(
            user_id=user_id,
            model_used=model_used,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
        self.db.add(usage)
        await self.db.flush()
        return usage

    async def get_usage_summary(self, *, user_id: UUID) -> dict:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(UsageLog.tokens_used), 0),
                func.count(UsageLog.id),
            ).where(UsageLog.user_id == user_id)
        )
        tokens_used, request_count = result.one()
        return {
            "total_tokens": int(tokens_used or 0),
            "total_requests": int(request_count or 0),
        }

    async def get_daily_usage(self, *, user_id: UUID, days: int = 7) -> list[dict]:
        day_expr = func.date_trunc("day", UsageLog.created_at)
        result = await self.db.execute(
            select(
                day_expr.label("day"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("tokens"),
                func.count(UsageLog.id).label("requests"),
            )
            .where(UsageLog.user_id == user_id)
            .group_by(day_expr)
            .order_by(day_expr.desc())
            .limit(days)
        )
        rows = result.all()
        rows.reverse()
        return [
            {
                "date": row.day.strftime("%b %d"),
                "tokens": int(row.tokens or 0),
                "requests": int(row.requests or 0),
            }
            for row in rows
        ]

    async def get_recent_usage_logs(self, *, user_id: UUID, limit: int = 10) -> list[UsageLog]:
        result = await self.db.execute(
            select(UsageLog)
            .where(UsageLog.user_id == user_id)
            .order_by(UsageLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
