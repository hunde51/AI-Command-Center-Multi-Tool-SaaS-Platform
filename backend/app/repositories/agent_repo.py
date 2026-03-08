from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.agent_usage import AgentUsage


class AgentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_agent(
        self,
        *,
        user_id: UUID,
        name: str,
        description: str,
        system_prompt: str,
        knowledge_base_id: UUID | None,
        is_active: bool,
    ) -> Agent:
        row = Agent(
            user_id=user_id,
            name=name,
            description=description,
            system_prompt=system_prompt,
            knowledge_base_id=knowledge_base_id,
            is_active=is_active,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_user_agents(self, *, user_id: UUID) -> list[Agent]:
        result = await self.db.execute(
            select(Agent)
            .where(Agent.user_id == user_id)
            .order_by(Agent.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_agent_by_id(self, *, agent_id: UUID) -> Agent | None:
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        return result.scalar_one_or_none()

    async def update_agent(
        self,
        *,
        agent: Agent,
        name: str,
        description: str,
        system_prompt: str,
        knowledge_base_id: UUID | None,
        is_active: bool,
    ) -> Agent:
        agent.name = name
        agent.description = description
        agent.system_prompt = system_prompt
        agent.knowledge_base_id = knowledge_base_id
        agent.is_active = is_active
        await self.db.flush()
        return agent

    async def delete_agent(self, *, agent: Agent) -> None:
        await self.db.delete(agent)
        await self.db.flush()

    async def create_agent_usage(self, *, agent_id: UUID, user_id: UUID, tokens_used: int) -> AgentUsage:
        row = AgentUsage(agent_id=agent_id, user_id=user_id, tokens_used=tokens_used)
        self.db.add(row)
        await self.db.flush()
        return row
