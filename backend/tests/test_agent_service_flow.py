from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import uuid

import pytest

from app.ai_engine.base import AIProvider
from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.models.role import UserRole
from app.services.agent_service import AgentService


@dataclass
class DummyAgent:
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str
    system_prompt: str
    knowledge_base_id: uuid.UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DummyAgentRepo:
    def __init__(self, agent: DummyAgent) -> None:
        self.agent = agent
        self.db = self
        self.agent_usages: list[tuple[uuid.UUID, uuid.UUID, int]] = []

    async def rollback(self) -> None:
        return None

    async def commit(self) -> None:
        return None

    async def refresh(self, _row) -> None:
        return None

    async def get_agent_by_id(self, *, agent_id):
        if self.agent.id == agent_id:
            return self.agent
        return None

    async def create_agent_usage(self, *, agent_id, user_id, tokens_used):
        self.agent_usages.append((agent_id, user_id, tokens_used))


class DummyChatRepo:
    def __init__(self) -> None:
        self.conversations: list[str] = []
        self.messages: list[tuple[str, str]] = []

    async def create_conversation(self, *, user_id, title):
        _ = user_id
        self.conversations.append(title)
        return type("Conv", (), {"id": uuid.uuid4()})()

    async def create_message(self, *, conversation_id, role, content, token_count):
        _ = conversation_id
        _ = token_count
        self.messages.append((role, content))


class DummyUsageRepo:
    def __init__(self) -> None:
        self.logs: list[tuple[uuid.UUID, int]] = []

    async def log_usage(self, *, user_id, model_used, tokens_used, cost_estimate):
        _ = model_used
        _ = cost_estimate
        self.logs.append((user_id, tokens_used))


class DummyQuotaService:
    def __init__(self) -> None:
        self.allowed_calls = 0
        self.consumed = 0

    async def ensure_allowed(self, *, user_id, requested_tokens):
        _ = user_id
        _ = requested_tokens
        self.allowed_calls += 1

    async def consume(self, *, user_id, tokens_used):
        _ = user_id
        self.consumed += tokens_used


class DummyProvider(AIProvider):
    async def generate_response(self, *, model: str, prompt: str, messages=None, api_key=None) -> dict:
        _ = prompt
        _ = messages
        _ = api_key
        return {
            "content": "agent answer",
            "model_used": model,
            "usage": {"prompt_tokens": 12, "completion_tokens": 8, "total_tokens": 20},
        }

    def calculate_tokens(self, response_payload: dict) -> dict:
        return response_payload

    def handle_errors(self, exc: Exception):
        raise exc


class DummyUser:
    def __init__(self, user_id: uuid.UUID):
        self.id = user_id
        self.role = UserRole.USER


@pytest.mark.asyncio
async def test_agent_chat_flow_tracks_usage_and_quota() -> None:
    user_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    agent = DummyAgent(
        id=uuid.uuid4(),
        user_id=user_id,
        name="Helper",
        description="desc",
        system_prompt="You are helpful",
        knowledge_base_id=None,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    agent_repo = DummyAgentRepo(agent)
    chat_repo = DummyChatRepo()
    usage_repo = DummyUsageRepo()
    quota_service = DummyQuotaService()

    service = AgentService(
        agent_repo=agent_repo,
        chat_repo=chat_repo,
        usage_repo=usage_repo,
        provider=DummyProvider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
        quota_service=quota_service,
    )

    result = await service.chat_with_agent(
        current_user=DummyUser(user_id),
        agent_id=agent.id,
        message="Summarize this",
    )

    assert result.tokens_used == 20
    assert quota_service.allowed_calls == 1
    assert quota_service.consumed == 20
    assert len(chat_repo.conversations) == 1
    assert len(chat_repo.messages) == 2
    assert len(agent_repo.agent_usages) == 1
    assert len(usage_repo.logs) == 1
