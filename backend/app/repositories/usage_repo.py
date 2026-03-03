from __future__ import annotations

from uuid import UUID

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
