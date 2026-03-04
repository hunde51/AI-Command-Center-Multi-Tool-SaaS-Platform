from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=8000)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        # Placeholder for stronger prompt-injection protections in future phases.
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be empty")
        blocked_patterns = ["<script", "ignore all previous instructions"]
        lowered = cleaned.lower()
        if any(pattern in lowered for pattern in blocked_patterns):
            raise ValueError("Message contains disallowed content")
        return cleaned


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: str
    content: str
    token_count: int
    created_at: datetime


class UsageRead(BaseModel):
    model_used: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_estimate: float


class ChatResponse(BaseModel):
    conversation: ConversationRead
    user_message: MessageRead
    assistant_message: MessageRead
    usage: UsageRead


class ConversationHistoryResponse(BaseModel):
    conversation: ConversationRead
    messages: list[MessageRead]


class ConversationRenameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Title cannot be empty")
        return cleaned
