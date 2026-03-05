from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tool import Tool
from app.models.tool_usage import ToolUsage


class ToolRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_tool_by_slug(self, *, slug: str) -> Tool | None:
        result = await self.db.execute(select(Tool).where(Tool.slug == slug))
        return result.scalar_one_or_none()

    async def list_active_tools(self) -> list[Tool]:
        result = await self.db.execute(
            select(Tool).where(Tool.is_active.is_(True)).order_by(Tool.name.asc())
        )
        return list(result.scalars().all())

    async def list_tools(self) -> list[Tool]:
        result = await self.db.execute(select(Tool).order_by(Tool.name.asc()))
        return list(result.scalars().all())

    async def create_tool(
        self,
        *,
        name: str,
        slug: str,
        description: str,
        system_prompt_template: str,
        input_schema: dict,
        is_active: bool,
        version: int,
    ) -> Tool:
        tool = Tool(
            name=name,
            slug=slug,
            description=description,
            system_prompt_template=system_prompt_template,
            input_schema=input_schema,
            is_active=is_active,
            version=version,
        )
        self.db.add(tool)
        await self.db.flush()
        return tool

    async def get_tool_by_id(self, *, tool_id: UUID) -> Tool | None:
        result = await self.db.execute(select(Tool).where(Tool.id == tool_id))
        return result.scalar_one_or_none()

    async def update_tool(
        self,
        *,
        tool: Tool,
        name: str,
        slug: str,
        description: str,
        system_prompt_template: str,
        input_schema: dict,
        is_active: bool,
        version: int,
    ) -> Tool:
        tool.name = name
        tool.slug = slug
        tool.description = description
        tool.system_prompt_template = system_prompt_template
        tool.input_schema = input_schema
        tool.is_active = is_active
        tool.version = version
        await self.db.flush()
        return tool

    async def set_tool_active(self, *, tool: Tool, is_active: bool) -> Tool:
        tool.is_active = is_active
        await self.db.flush()
        return tool

    async def delete_tool(self, *, tool: Tool) -> None:
        await self.db.delete(tool)
        await self.db.flush()

    async def create_tool_usage(
        self,
        *,
        tool_id: UUID,
        user_id: UUID,
        tokens_used: int,
        cost_estimate: float,
    ) -> ToolUsage:
        usage = ToolUsage(
            tool_id=tool_id,
            user_id=user_id,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
        self.db.add(usage)
        await self.db.flush()
        return usage

    async def get_user_tool_history(self, *, user_id: UUID) -> list[ToolUsage]:
        result = await self.db.execute(
            select(ToolUsage)
            .where(ToolUsage.user_id == user_id)
            .options(selectinload(ToolUsage.tool))
            .order_by(ToolUsage.created_at.desc())
        )
        return list(result.scalars().all())
