from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import uuid

import pytest

from app.services.quota_service import QuotaExceededError, QuotaService


@dataclass
class DummyPlan:
    id: uuid.UUID
    monthly_token_limit: int


@dataclass
class DummySubscription:
    user_id: uuid.UUID
    plan_id: uuid.UUID
    tokens_used: int
    reset_date: datetime


class DummyRepo:
    def __init__(self, limit: int = 1000) -> None:
        self.plan = DummyPlan(id=uuid.uuid4(), monthly_token_limit=limit)
        self.subs: dict[uuid.UUID, DummySubscription] = {}
        self.db = self

    async def flush(self) -> None:
        return None

    async def get_user_subscription(self, *, user_id: uuid.UUID):
        return self.subs.get(user_id)

    async def get_default_plan(self):
        return self.plan

    async def ensure_user_subscription(self, *, user_id: uuid.UUID):
        sub = self.subs.get(user_id)
        if sub:
            return sub
        sub = DummySubscription(
            user_id=user_id,
            plan_id=self.plan.id,
            tokens_used=0,
            reset_date=datetime.now(timezone.utc) + timedelta(days=30),
        )
        self.subs[user_id] = sub
        return sub

    async def get_plan(self, *, plan_id: uuid.UUID):
        _ = plan_id
        return self.plan


@pytest.mark.asyncio
async def test_quota_allows_and_consumes_tokens() -> None:
    repo = DummyRepo(limit=1000)
    service = QuotaService(repo)
    user_id = uuid.uuid4()

    await service.ensure_allowed(user_id=user_id, requested_tokens=200)
    await service.consume(user_id=user_id, tokens_used=200)

    assert repo.subs[user_id].tokens_used == 200


@pytest.mark.asyncio
async def test_quota_exceeded_raises() -> None:
    repo = DummyRepo(limit=100)
    service = QuotaService(repo)
    user_id = uuid.uuid4()

    await service.consume(user_id=user_id, tokens_used=90)

    with pytest.raises(QuotaExceededError):
        await service.ensure_allowed(user_id=user_id, requested_tokens=20)
