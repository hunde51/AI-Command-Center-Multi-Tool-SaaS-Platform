from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.provider_factory import get_ai_provider
from app.api.deps import get_current_active_user, require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.tool import (
    ToolActivationRequest,
    ToolCreateRequest,
    ToolExecuteRequest,
    ToolUpdateRequest,
)
from app.services.tool_service import ToolService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/tools", tags=["tools"])
admin_router = APIRouter(prefix="/admin/tools", tags=["admin-tools"])


def _service(db: AsyncSession) -> ToolService:
    return ToolService(
        tool_repo=ToolRepository(db),
        usage_repo=UsageRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
    )


@router.post("/{slug}")
async def execute_tool(
    slug: str,
    payload: ToolExecuteRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await _service(db).execute_tool(
        slug=slug,
        user_input=payload.input,
        user_id=current_user.id,
    )
    return api_response(True, "Tool executed successfully", result.model_dump())


@router.get("")
async def list_active_tools(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).list_active_tools()
    return api_response(True, "Tools fetched", {"tools": [row.model_dump() for row in rows]})


@router.get("/history")
async def get_tool_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await _service(db).get_user_tool_history(user_id=current_user.id)
    return api_response(True, "Tool usage history fetched", {"history": [row.model_dump() for row in rows]})


@admin_router.post("")
async def create_tool(
    payload: ToolCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    tool = await _service(db).create_tool(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        system_prompt_template=payload.system_prompt_template,
        input_schema=payload.input_schema,
        is_active=payload.is_active,
        version=payload.version,
    )
    return api_response(True, "Tool created", {"tool": tool.model_dump()})


@admin_router.get("")
async def list_tools_admin(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).list_tools()
    return api_response(True, "Tools fetched", {"tools": [row.model_dump() for row in rows]})


@admin_router.put("/{tool_id}")
async def update_tool(
    tool_id: UUID,
    payload: ToolUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    tool = await _service(db).update_tool(
        tool_id=tool_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        system_prompt_template=payload.system_prompt_template,
        input_schema=payload.input_schema,
        is_active=payload.is_active,
        version=payload.version,
    )
    return api_response(True, "Tool updated", {"tool": tool.model_dump()})


@admin_router.delete("/{tool_id}")
async def delete_tool(
    tool_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    await _service(db).delete_tool(tool_id=tool_id)
    return api_response(True, "Tool deleted", {})


@admin_router.patch("/{tool_id}/activate")
async def activate_tool(
    tool_id: UUID,
    payload: ToolActivationRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    tool = await _service(db).set_tool_active(tool_id=tool_id, is_active=payload.is_active)
    return api_response(True, "Tool activation updated", {"tool": tool.model_dump()})
