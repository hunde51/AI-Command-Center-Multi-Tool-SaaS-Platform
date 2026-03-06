from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models.role import UserRole


class AdminUserRead(BaseModel):
    user_id: UUID
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    total_tokens_used: int
    total_tools_used: int


class AdminLogRead(BaseModel):
    id: UUID
    admin_id: UUID
    action: str
    target_user_id: UUID | None
    metadata: dict[str, Any]
    created_at: datetime


class AdminOverviewRead(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    total_conversations: int
    total_messages: int
    total_ai_requests: int
    total_tokens_used: int
    total_tools_executed: int


class TokenUsageRead(BaseModel):
    date: str
    tokens: int


class ToolUsageStatsRead(BaseModel):
    tool_name: str
    executions: int


class TopUserUsageRead(BaseModel):
    user_id: UUID
    username: str
    tokens_used: int
