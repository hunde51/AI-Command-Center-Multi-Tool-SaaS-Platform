from __future__ import annotations

from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.analytics import ActivityRead, DailyUsageRead, UsageStatsRead


class AnalyticsService:
    def __init__(self, usage_repo: UsageRepository, tool_repo: ToolRepository) -> None:
        self.usage_repo = usage_repo
        self.tool_repo = tool_repo

    async def get_usage_stats(self, *, user_id) -> UsageStatsRead:
        summary = await self.usage_repo.get_usage_summary(user_id=user_id)
        active_tools = await self.tool_repo.list_active_tools()
        return UsageStatsRead(
            total_tokens=summary["total_tokens"],
            total_requests=summary["total_requests"],
            active_tools=len(active_tools),
            uptime=99.9,
        )

    async def get_daily_usage(self, *, user_id, days: int = 7) -> list[DailyUsageRead]:
        rows = await self.usage_repo.get_daily_usage(user_id=user_id, days=days)
        return [DailyUsageRead(**row) for row in rows]

    async def get_activities(self, *, user_id, limit: int = 10) -> list[ActivityRead]:
        rows = await self.usage_repo.get_recent_usage_logs(user_id=user_id, limit=limit)
        return [
            ActivityRead(
                id=str(row.id),
                action="AI request completed",
                tool=row.model_used,
                timestamp=row.created_at.strftime("%Y-%m-%d %H:%M"),
                tokens=row.tokens_used,
                status="success",
            )
            for row in rows
        ]
