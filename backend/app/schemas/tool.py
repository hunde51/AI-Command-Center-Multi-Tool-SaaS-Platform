from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ToolExecuteRequest(BaseModel):
    input: str = Field(min_length=1, max_length=20000)

    @field_validator("input")
    @classmethod
    def validate_input(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Input cannot be empty")
        return cleaned


class ToolCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    system_prompt_template: str = Field(min_length=1)
    input_schema: dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    version: int = Field(default=1, ge=1)


class ToolUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    system_prompt_template: str = Field(min_length=1)
    input_schema: dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    version: int = Field(ge=1)


class ToolActivationRequest(BaseModel):
    is_active: bool


class ToolRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: str
    system_prompt_template: str
    input_schema: dict[str, Any]
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime


class ToolExecutionRead(BaseModel):
    tool: ToolRead
    output: str
    tokens_used: int
    cost_estimate: float
    model_used: str


class ToolUsageRead(BaseModel):
    id: UUID
    tool_id: UUID
    tool_slug: str
    tool_name: str
    tokens_used: int
    cost_estimate: float
    created_at: datetime
