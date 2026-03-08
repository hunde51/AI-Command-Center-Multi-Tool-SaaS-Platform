from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AgentCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    system_prompt: str = Field(min_length=1)
    knowledge_base_id: UUID | None = None
    is_active: bool = True


class AgentUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    system_prompt: str = Field(min_length=1)
    knowledge_base_id: UUID | None = None
    is_active: bool = True


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be empty")
        return cleaned


class AgentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    description: str
    system_prompt: str
    knowledge_base_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AgentChatResponse(BaseModel):
    agent: AgentRead
    output: str
    model_used: str
    tokens_used: int
    cost_estimate: float
