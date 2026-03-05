from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

import pytest

from app.ai_engine.base import AIProvider
from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.services.tool_service import ToolService, ToolServiceError


@dataclass
class DummyTool:
    id: uuid.UUID
    name: str
    slug: str
    description: str
    system_prompt_template: str
    input_schema: dict
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime


class DummyDB:
    def __init__(self) -> None:
        self.commits = 0
        self.rollbacks = 0

    async def commit(self) -> None:
        self.commits += 1

    async def rollback(self) -> None:
        self.rollbacks += 1


class DummyToolRepo:
    def __init__(self, tool: DummyTool | None) -> None:
        self.tool = tool
        self.db = DummyDB()
        self.logged_tool_usage: list[tuple[uuid.UUID, uuid.UUID, int, float]] = []

    async def get_tool_by_slug(self, *, slug: str):
        if self.tool and self.tool.slug == slug:
            return self.tool
        return None

    async def create_tool_usage(
        self,
        *,
        tool_id: uuid.UUID,
        user_id: uuid.UUID,
        tokens_used: int,
        cost_estimate: float,
    ):
        self.logged_tool_usage.append((tool_id, user_id, tokens_used, cost_estimate))
        return None


class DummyUsageRepo:
    def __init__(self) -> None:
        self.logged_usage: list[tuple[uuid.UUID, str, int, float]] = []

    async def log_usage(
        self,
        *,
        user_id: uuid.UUID,
        model_used: str,
        tokens_used: int,
        cost_estimate: float,
    ):
        self.logged_usage.append((user_id, model_used, tokens_used, cost_estimate))
        return None


class DummyProvider(AIProvider):
    async def generate_response(self, *, model: str, prompt: str, messages=None) -> dict:
        _ = messages
        return {
            "content": f"Result for: {prompt[:20]}",
            "model_used": model,
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        }

    def calculate_tokens(self, response_payload: dict) -> dict:
        return response_payload

    def handle_errors(self, exc: Exception):
        raise exc


def _build_tool(*, is_active: bool = True, input_schema: dict | None = None) -> DummyTool:
    now = datetime.now(tz=timezone.utc)
    return DummyTool(
        id=uuid.uuid4(),
        name="Resume Analyzer",
        slug="resume-analyzer",
        description="desc",
        system_prompt_template="Analyze:\n\n{{input}}",
        input_schema=input_schema or {},
        is_active=is_active,
        version=1,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_execute_tool_success_logs_usage() -> None:
    tool = _build_tool(input_schema={"type": "string", "min_length": 3})
    tool_repo = DummyToolRepo(tool)
    usage_repo = DummyUsageRepo()
    service = ToolService(
        tool_repo=tool_repo,
        usage_repo=usage_repo,
        provider=DummyProvider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
    )

    result = await service.execute_tool("resume-analyzer", "my resume text", uuid.uuid4())

    assert result.tool.slug == "resume-analyzer"
    assert result.tokens_used == 30
    assert tool_repo.db.commits == 1
    assert len(tool_repo.logged_tool_usage) == 1
    assert len(usage_repo.logged_usage) == 1


@pytest.mark.asyncio
async def test_execute_tool_rejects_inactive_tool() -> None:
    tool = _build_tool(is_active=False)
    service = ToolService(
        tool_repo=DummyToolRepo(tool),
        usage_repo=DummyUsageRepo(),
        provider=DummyProvider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
    )

    with pytest.raises(ToolServiceError) as exc:
        await service.execute_tool("resume-analyzer", "my resume text", uuid.uuid4())

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_execute_tool_enforces_input_schema_min_length() -> None:
    tool = _build_tool(input_schema={"type": "string", "min_length": 12})
    service = ToolService(
        tool_repo=DummyToolRepo(tool),
        usage_repo=DummyUsageRepo(),
        provider=DummyProvider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
    )

    with pytest.raises(ToolServiceError) as exc:
        await service.execute_tool("resume-analyzer", "short", uuid.uuid4())

    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_execute_tool_enforces_input_schema_pattern() -> None:
    tool = _build_tool(input_schema={"type": "string", "pattern": r"^[A-Za-z ]+$"})
    service = ToolService(
        tool_repo=DummyToolRepo(tool),
        usage_repo=DummyUsageRepo(),
        provider=DummyProvider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
    )

    with pytest.raises(ToolServiceError) as exc:
        await service.execute_tool("resume-analyzer", "text 123", uuid.uuid4())

    assert exc.value.status_code == 422
