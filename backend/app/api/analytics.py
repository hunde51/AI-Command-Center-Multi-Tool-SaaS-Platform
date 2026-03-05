from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.services.analytics_service import AnalyticsService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _service(db: AsyncSession) -> AnalyticsService:
    return AnalyticsService(
        usage_repo=UsageRepository(db),
        tool_repo=ToolRepository(db),
    )


@router.get("/usage-stats")
async def usage_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stats = await _service(db).get_usage_stats(user_id=current_user.id)
    return api_response(True, "Usage stats fetched", stats.model_dump())


@router.get("/daily-usage")
async def daily_usage(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await _service(db).get_daily_usage(user_id=current_user.id, days=days)
    return api_response(True, "Daily usage fetched", {"daily_usage": [row.model_dump() for row in rows]})


@router.get("/activities")
async def activities(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await _service(db).get_activities(user_id=current_user.id, limit=limit)
    return api_response(True, "Activities fetched", {"activities": [row.model_dump() for row in rows]})
