from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.file_document import FileDocument
from app.models.message import Message
from app.models.tool import Tool
from app.models.tool_usage import ToolUsage
from app.models.usage_log import UsageLog
from app.models.user import User
from app.models.agent import Agent
from app.models.agent_usage import AgentUsage
from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.admin import (
    AdminOverviewRead,
    AgentTopUserRead,
    AgentUsageRead,
    FileUsageRead,
    ModelUsageRead,
    TokenUsageRead,
    ToolUsageStatsRead,
    TopUserUsageRead,
)
from app.schemas.analytics import ActivityRead, DailyUsageRead, UsageStatsRead


class AnalyticsService:
    def __init__(self, usage_repo: UsageRepository, tool_repo: ToolRepository, db: AsyncSession) -> None:
        self.usage_repo = usage_repo
        self.tool_repo = tool_repo
        self.db = db

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
        capped_limit = max(1, min(limit, 10))
        rows = await self.usage_repo.get_recent_usage_logs(user_id=user_id, limit=capped_limit)
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

    async def get_admin_overview(self) -> AdminOverviewRead:
        total_users = await self.db.scalar(
            select(func.count(User.id)).where(User.is_deleted.is_(False))
        )
        active_users = await self.db.scalar(
            select(func.count(User.id)).where(User.is_deleted.is_(False), User.is_active.is_(True))
        )
        suspended_users = await self.db.scalar(
            select(func.count(User.id)).where(User.is_deleted.is_(False), User.is_active.is_(False))
        )
        total_conversations = await self.db.scalar(select(func.count(Conversation.id)))
        total_messages = await self.db.scalar(select(func.count(Message.id)))
        ai_agg = await self.db.execute(
            select(
                func.count(UsageLog.id).label("requests"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("tokens"),
            )
        )
        tool_count = await self.db.scalar(select(func.count(ToolUsage.id)))

        row = ai_agg.one()
        return AdminOverviewRead(
            total_users=int(total_users or 0),
            active_users=int(active_users or 0),
            suspended_users=int(suspended_users or 0),
            total_conversations=int(total_conversations or 0),
            total_messages=int(total_messages or 0),
            total_ai_requests=int(row.requests or 0),
            total_tokens_used=int(row.tokens or 0),
            total_tools_executed=int(tool_count or 0),
        )

    async def get_admin_token_usage(self, *, days: int = 30) -> list[TokenUsageRead]:
        day_expr = func.date_trunc("day", UsageLog.created_at)
        result = await self.db.execute(
            select(
                day_expr.label("day"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("tokens"),
            )
            .group_by(day_expr)
            .order_by(day_expr.desc())
            .limit(days)
        )
        rows = list(result.all())
        rows.reverse()
        return [
            TokenUsageRead(
                date=row.day.strftime("%Y-%m-%d"),
                tokens=int(row.tokens or 0),
            )
            for row in rows
        ]

    async def get_admin_tool_usage(self) -> list[ToolUsageStatsRead]:
        result = await self.db.execute(
            select(
                Tool.name.label("tool_name"),
                func.count(ToolUsage.id).label("executions"),
            )
            .join(ToolUsage, ToolUsage.tool_id == Tool.id)
            .group_by(Tool.id)
            .order_by(func.count(ToolUsage.id).desc())
        )
        return [
            ToolUsageStatsRead(tool_name=row.tool_name, executions=int(row.executions or 0))
            for row in result.all()
        ]

    async def get_admin_top_users(self, *, limit: int = 10) -> list[TopUserUsageRead]:
        result = await self.db.execute(
            select(
                User.id.label("user_id"),
                User.username.label("username"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("tokens_used"),
            )
            .join(UsageLog, UsageLog.user_id == User.id)
            .where(User.is_deleted.is_(False))
            .group_by(User.id)
            .order_by(func.sum(UsageLog.tokens_used).desc())
            .limit(limit)
        )
        return [
            TopUserUsageRead(
                user_id=row.user_id,
                username=row.username,
                tokens_used=int(row.tokens_used or 0),
            )
            for row in result.all()
        ]

    async def get_admin_model_usage(self) -> list[ModelUsageRead]:
        result = await self.db.execute(
            select(
                UsageLog.model_used.label("model_name"),
                func.count(UsageLog.id).label("requests"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("tokens"),
            )
            .group_by(UsageLog.model_used)
            .order_by(func.count(UsageLog.id).desc())
        )
        return [
            ModelUsageRead(
                model_name=row.model_name or "unknown",
                requests=int(row.requests or 0),
                tokens=int(row.tokens or 0),
            )
            for row in result.all()
        ]

    async def get_admin_file_usage(self) -> FileUsageRead:
        uploaded = await self.db.scalar(select(func.count(FileDocument.id)))
        jobs = await self.db.scalar(select(func.coalesce(func.sum(FileDocument.analysis_jobs_executed), 0)))
        return FileUsageRead(
            files_uploaded=int(uploaded or 0),
            analysis_jobs_executed=int(jobs or 0),
        )

    async def get_admin_agent_usage(self, *, limit: int = 10) -> tuple[list[AgentUsageRead], list[AgentTopUserRead]]:
        agent_rows = await self.db.execute(
            select(
                Agent.name.label("agent_name"),
                func.count(AgentUsage.id).label("executions"),
            )
            .join(AgentUsage, AgentUsage.agent_id == Agent.id)
            .group_by(Agent.id)
            .order_by(func.count(AgentUsage.id).desc())
            .limit(limit)
        )
        user_rows = await self.db.execute(
            select(
                User.id.label("user_id"),
                User.username.label("username"),
                func.count(AgentUsage.id).label("executions"),
            )
            .join(AgentUsage, AgentUsage.user_id == User.id)
            .group_by(User.id)
            .order_by(func.count(AgentUsage.id).desc())
            .limit(limit)
        )
        return (
            [
                AgentUsageRead(agent_name=row.agent_name, executions=int(row.executions or 0))
                for row in agent_rows.all()
            ],
            [
                AgentTopUserRead(
                    user_id=row.user_id,
                    username=row.username,
                    executions=int(row.executions or 0),
                )
                for row in user_rows.all()
            ],
        )
