from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.services.analytics_service import AnalyticsService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/analytics", tags=["admin-analytics"])


def _service(db: AsyncSession) -> AnalyticsService:
    return AnalyticsService(
        usage_repo=UsageRepository(db),
        tool_repo=ToolRepository(db),
        db=db,
    )


@router.get("/overview")
async def overview(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    metrics = await _service(db).get_admin_overview()
    return api_response(True, "Overview metrics fetched", metrics.model_dump())


@router.get("/token-usage")
async def token_usage(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).get_admin_token_usage(days=days)
    return api_response(True, "Token usage fetched", {"items": [row.model_dump() for row in rows]})


@router.get("/tool-usage")
async def tool_usage(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).get_admin_tool_usage()
    return api_response(True, "Tool usage fetched", {"items": [row.model_dump() for row in rows]})


@router.get("/top-users")
async def top_users(
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).get_admin_top_users(limit=limit)
    return api_response(True, "Top users fetched", {"items": [row.model_dump() for row in rows]})


@router.get("/model-usage")
async def model_usage(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    rows = await _service(db).get_admin_model_usage()
    return api_response(True, "Model usage fetched", {"items": [row.model_dump() for row in rows]})


@router.get("/file-usage")
async def file_usage(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    stats = await _service(db).get_admin_file_usage()
    return api_response(True, "File usage fetched", stats.model_dump())


@router.get("/agent-usage")
async def agent_usage(
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    by_agent, by_user = await _service(db).get_admin_agent_usage(limit=limit)
    return api_response(
        True,
        "Agent usage fetched",
        {
            "top_agents": [row.model_dump() for row in by_agent],
            "top_users": [row.model_dump() for row in by_user],
        },
    )
