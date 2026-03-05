from __future__ import annotations

from pydantic import BaseModel


class UsageStatsRead(BaseModel):
    total_tokens: int
    total_requests: int
    active_tools: int
    uptime: float


class DailyUsageRead(BaseModel):
    date: str
    tokens: int
    requests: int


class ActivityRead(BaseModel):
    id: str
    action: str
    tool: str
    timestamp: str
    tokens: int
    status: str
