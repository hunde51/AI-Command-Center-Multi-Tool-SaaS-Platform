from __future__ import annotations

from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import UserRole
from app.models.tool_usage import ToolUsage
from app.models.usage_log import UsageLog
from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_user(self, user: User) -> User:
        self.db.add(user)
        try:
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise
        await self.db.refresh(user)
        return user

    async def get_user_by_email(self, email: str, *, include_deleted: bool = False) -> User | None:
        conditions = [User.email == email]
        if not include_deleted:
            conditions.append(User.is_deleted.is_(False))
        result = await self.db.execute(select(User).where(*conditions))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID, *, include_deleted: bool = False) -> User | None:
        conditions = [User.id == user_id]
        if not include_deleted:
            conditions.append(User.is_deleted.is_(False))
        result = await self.db.execute(select(User).where(*conditions))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str, *, include_deleted: bool = False) -> User | None:
        conditions = [User.username == username]
        if not include_deleted:
            conditions.append(User.is_deleted.is_(False))
        result = await self.db.execute(select(User).where(*conditions))
        return result.scalar_one_or_none()

    async def list_users_for_admin(
        self,
        *,
        page: int,
        limit: int,
        search: str | None = None,
        role: UserRole | None = None,
        status: str | None = None,
    ) -> tuple[list[dict], int]:
        usage_subq = (
            select(
                UsageLog.user_id.label("usage_user_id"),
                func.coalesce(func.sum(UsageLog.tokens_used), 0).label("total_tokens_used"),
            )
            .group_by(UsageLog.user_id)
            .subquery()
        )
        tools_subq = (
            select(
                ToolUsage.user_id.label("tool_user_id"),
                func.count(ToolUsage.id).label("total_tools_used"),
            )
            .group_by(ToolUsage.user_id)
            .subquery()
        )

        filters = [User.is_deleted.is_(False)]
        if search:
            filters.append(or_(User.email.ilike(f"%{search}%"), User.username.ilike(f"%{search}%")))
        if role:
            filters.append(User.role == role)
        if status == "active":
            filters.append(User.is_active.is_(True))
        elif status == "suspended":
            filters.append(User.is_active.is_(False))

        total_stmt = select(func.count(User.id)).where(and_(*filters))
        total_result = await self.db.execute(total_stmt)
        total = int(total_result.scalar_one() or 0)

        offset = (page - 1) * limit
        rows_stmt = (
            select(
                User.id,
                User.email,
                User.username,
                User.role,
                User.is_active,
                User.created_at,
                func.coalesce(usage_subq.c.total_tokens_used, 0).label("total_tokens_used"),
                func.coalesce(tools_subq.c.total_tools_used, 0).label("total_tools_used"),
            )
            .outerjoin(usage_subq, usage_subq.c.usage_user_id == User.id)
            .outerjoin(tools_subq, tools_subq.c.tool_user_id == User.id)
            .where(and_(*filters))
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows_result = await self.db.execute(rows_stmt)
        rows = []
        for row in rows_result.all():
            rows.append(
                {
                    "user_id": row.id,
                    "email": row.email,
                    "username": row.username,
                    "role": row.role,
                    "is_active": row.is_active,
                    "created_at": row.created_at,
                    "total_tokens_used": int(row.total_tokens_used or 0),
                    "total_tools_used": int(row.total_tools_used or 0),
                }
            )
        return rows, total
