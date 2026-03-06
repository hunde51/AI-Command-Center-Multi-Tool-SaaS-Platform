from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.admin_log_repo import AdminLogRepository
from app.repositories.user_repo import UserRepository
from app.services.admin_service import AdminUserService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/logs", tags=["admin-logs"])


def _service(db: AsyncSession) -> AdminUserService:
    return AdminUserService(
        user_repo=UserRepository(db),
        admin_log_repo=AdminLogRepository(db),
    )


@router.get("")
async def get_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    admin_id: UUID | None = Query(default=None),
    target_user_id: UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    data = await _service(db).list_admin_logs(
        page=page,
        limit=limit,
        admin_id=admin_id,
        target_user_id=target_user_id,
        action=action,
    )
    return api_response(True, "Admin logs fetched", data)
