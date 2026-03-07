from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.provider_factory import get_ai_provider
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.admin_log_repo import AdminLogRepository
from app.repositories.provider_credential_repo import ProviderCredentialRepository
from app.repositories.tool_repo import ToolRepository
from app.repositories.user_repo import UserRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.tool import ToolCreateRequest, ToolRead, ToolUpdateRequest
from app.services.provider_key_service import ProviderKeyService
from app.services.admin_service import AdminUserService
from app.services.tool_service import ToolService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/tools", tags=["admin-tools"])


def _tool_service(db: AsyncSession) -> ToolService:
    return ToolService(
        tool_repo=ToolRepository(db),
        usage_repo=UsageRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        cost_calculator=CostCalculator(),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
    )


def _admin_service(db: AsyncSession) -> AdminUserService:
    return AdminUserService(UserRepository(db), AdminLogRepository(db))


async def _log_tool_action(
    *,
    db: AsyncSession,
    admin_id: UUID,
    action: str,
    tool: ToolRead | None,
    metadata: dict,
) -> None:
    await _admin_service(db).create_admin_log(
        admin_id=admin_id,
        action=action,
        target_user_id=None,
        metadata={
            "tool_id": str(tool.id) if tool else None,
            **metadata,
        },
    )


@router.get("")
async def list_tools(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _tool_service(db).list_tools()
    return api_response(True, "Tools fetched", {"tools": [row.model_dump() for row in rows]})


@router.post("")
async def create_tool(
    payload: ToolCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tool = await _tool_service(db).create_tool(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        system_prompt_template=payload.system_prompt_template,
        model_name=payload.model_name,
        input_schema=payload.input_schema,
        admin_locked=payload.admin_locked,
        is_active=payload.is_active,
        version=payload.version,
        created_by_user_id=current_user.id,
        actor_role=current_user.role.value,
    )
    await _log_tool_action(
        db=db,
        admin_id=current_user.id,
        action="tool_created",
        tool=tool,
        metadata={"tool_slug": tool.slug, "version": tool.version},
    )
    return api_response(True, "Tool created", {"tool": tool.model_dump()})


@router.put("/{tool_id}")
async def update_tool(
    tool_id: UUID,
    payload: ToolUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tool = await _tool_service(db).update_tool(
        tool_id=tool_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        system_prompt_template=payload.system_prompt_template,
        model_name=payload.model_name,
        input_schema=payload.input_schema,
        admin_locked=payload.admin_locked,
        is_active=payload.is_active,
        version=payload.version,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
    )
    await _log_tool_action(
        db=db,
        admin_id=current_user.id,
        action="tool_modified",
        tool=tool,
        metadata={"tool_slug": tool.slug, "version": tool.version, "is_active": tool.is_active},
    )
    return api_response(True, "Tool updated", {"tool": tool.model_dump()})


@router.patch("/{tool_id}/activate")
async def activate_tool(
    tool_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tool = await _tool_service(db).set_tool_active(tool_id=tool_id, is_active=True)
    await _log_tool_action(
        db=db,
        admin_id=current_user.id,
        action="tool_modified",
        tool=tool,
        metadata={"is_active": True},
    )
    return api_response(True, "Tool activated", {"tool": tool.model_dump()})


@router.patch("/{tool_id}/deactivate")
async def deactivate_tool(
    tool_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tool = await _tool_service(db).set_tool_active(tool_id=tool_id, is_active=False)
    await _log_tool_action(
        db=db,
        admin_id=current_user.id,
        action="tool_modified",
        tool=tool,
        metadata={"is_active": False},
    )
    return api_response(True, "Tool deactivated", {"tool": tool.model_dump()})


@router.delete("/{tool_id}")
async def delete_tool(
    tool_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _tool_service(db).delete_tool(tool_id=tool_id)
    await _admin_service(db).create_admin_log(
        admin_id=current_user.id,
        action="tool_modified",
        target_user_id=None,
        metadata={"tool_id": str(tool_id), "deleted": True},
    )
    return api_response(True, "Tool deleted", {})
