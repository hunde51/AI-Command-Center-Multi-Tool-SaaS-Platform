from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.role import UserRole
from app.models.user import User
from app.repositories.admin_log_repo import AdminLogRepository
from app.repositories.user_repo import UserRepository
from app.services.admin_service import AdminUserService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/users", tags=["admin-users"])


def _service(db: AsyncSession) -> AdminUserService:
    return AdminUserService(
        user_repo=UserRepository(db),
        admin_log_repo=AdminLogRepository(db),
    )


@router.get("")
async def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    role: UserRole | None = Query(default=None),
    status: str | None = Query(default=None, pattern="^(active|suspended)$"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _ = current_user
    data = await _service(db).list_users(
        page=page,
        limit=limit,
        search=search,
        role=role,
        status=status,
    )
    return api_response(True, "Users fetched", data)


@router.patch("/{user_id}/suspend")
async def suspend_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _service(db).suspend_user(admin_id=current_user.id, user_id=user_id)
    return api_response(True, "User suspended", {})


@router.patch("/{user_id}/activate")
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _service(db).activate_user(admin_id=current_user.id, user_id=user_id)
    return api_response(True, "User activated", {})


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _service(db).soft_delete_user(admin_id=current_user.id, user_id=user_id)
    return api_response(True, "User deleted", {})
