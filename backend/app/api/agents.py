from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.provider_factory import get_ai_provider
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.agent_repo import AgentRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.subscription_repo import SubscriptionRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.agent import AgentChatRequest, AgentCreateRequest, AgentUpdateRequest
from app.services.agent_service import AgentService
from app.services.quota_service import QuotaService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/agents", tags=["agents"])


def _service(db: AsyncSession) -> AgentService:
    return AgentService(
        agent_repo=AgentRepository(db),
        chat_repo=ChatRepository(db),
        usage_repo=UsageRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )


@router.post("")
async def create_agent(
    payload: AgentCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    row = await _service(db).create_agent(
        current_user=current_user,
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt,
        knowledge_base_id=payload.knowledge_base_id,
        is_active=payload.is_active,
    )
    return api_response(True, "Agent created", {"agent": row.model_dump()})


@router.get("")
async def list_agents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await _service(db).list_user_agents(current_user=current_user)
    return api_response(True, "Agents fetched", {"agents": [r.model_dump() for r in rows]})


@router.put("/{agent_id}")
async def update_agent(
    agent_id: UUID,
    payload: AgentUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    row = await _service(db).update_agent(
        current_user=current_user,
        agent_id=agent_id,
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt,
        knowledge_base_id=payload.knowledge_base_id,
        is_active=payload.is_active,
    )
    return api_response(True, "Agent updated", {"agent": row.model_dump()})


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _service(db).delete_agent(current_user=current_user, agent_id=agent_id)
    return api_response(True, "Agent deleted", {})


@router.post("/{agent_id}/chat")
async def chat_with_agent(
    agent_id: UUID,
    payload: AgentChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await _service(db).chat_with_agent(
        current_user=current_user,
        agent_id=agent_id,
        message=payload.message,
    )
    return api_response(True, "Agent response generated", result.model_dump())
