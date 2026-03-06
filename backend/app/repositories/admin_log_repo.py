from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_log import AdminLog


class AdminLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_log(
        self,
        *,
        admin_id: UUID,
        action: str,
        target_user_id: UUID | None,
        metadata: dict[str, Any],
    ) -> AdminLog:
        row = AdminLog(
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            metadata_=metadata,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_logs(
        self,
        *,
        page: int,
        limit: int,
        admin_id: UUID | None = None,
        target_user_id: UUID | None = None,
        action: str | None = None,
    ) -> tuple[list[AdminLog], int]:
        filters = []
        if admin_id:
            filters.append(AdminLog.admin_id == admin_id)
        if target_user_id:
            filters.append(AdminLog.target_user_id == target_user_id)
        if action:
            filters.append(AdminLog.action == action)

        where_clause = and_(*filters) if filters else None

        total_stmt = select(func.count(AdminLog.id))
        if where_clause is not None:
            total_stmt = total_stmt.where(where_clause)
        total_result = await self.db.execute(total_stmt)
        total = int(total_result.scalar_one() or 0)

        rows_stmt = select(AdminLog)
        if where_clause is not None:
            rows_stmt = rows_stmt.where(where_clause)
        rows_stmt = rows_stmt.order_by(AdminLog.created_at.desc()).offset((page - 1) * limit).limit(limit)

        rows_result = await self.db.execute(rows_stmt)
        return list(rows_result.scalars().all()), total
