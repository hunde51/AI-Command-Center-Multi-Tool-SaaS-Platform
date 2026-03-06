from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import status

from app.models.role import UserRole
from app.repositories.admin_log_repo import AdminLogRepository
from app.repositories.user_repo import UserRepository
from app.schemas.admin import AdminLogRead, AdminUserRead
from app.utils.pagination import pagination_meta


class AdminServiceError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AdminUserService:
    def __init__(self, user_repo: UserRepository, admin_log_repo: AdminLogRepository) -> None:
        self.user_repo = user_repo
        self.admin_log_repo = admin_log_repo

    async def list_users(
        self,
        *,
        page: int,
        limit: int,
        search: str | None,
        role: UserRole | None,
        status: str | None,
    ) -> dict[str, Any]:
        rows, total = await self.user_repo.list_users_for_admin(
            page=page,
            limit=limit,
            search=search,
            role=role,
            status=status,
        )
        items = [AdminUserRead(**row).model_dump() for row in rows]
        return {
            "items": items,
            "pagination": pagination_meta(page=page, limit=limit, total=total),
        }

    async def suspend_user(self, *, admin_id: UUID, user_id: UUID) -> None:
        await self._set_user_active(admin_id=admin_id, user_id=user_id, is_active=False, action="user_suspended")

    async def activate_user(self, *, admin_id: UUID, user_id: UUID) -> None:
        await self._set_user_active(admin_id=admin_id, user_id=user_id, is_active=True, action="user_activated")

    async def soft_delete_user(self, *, admin_id: UUID, user_id: UUID) -> None:
        user = await self.user_repo.get_user_by_id(user_id=user_id)
        if not user:
            raise AdminServiceError("User not found", status.HTTP_404_NOT_FOUND)
        if user.role == UserRole.ADMIN:
            raise AdminServiceError("Admin user cannot be deleted", status.HTTP_403_FORBIDDEN)

        user.is_deleted = True
        user.is_active = False
        await self.admin_log_repo.create_log(
            admin_id=admin_id,
            action="user_deleted",
            target_user_id=user_id,
            metadata={"is_deleted": True},
        )
        await self.user_repo.db.commit()

    async def create_admin_log(
        self,
        *,
        admin_id: UUID,
        action: str,
        target_user_id: UUID | None,
        metadata: dict[str, Any],
    ) -> None:
        await self.admin_log_repo.create_log(
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            metadata=metadata,
        )
        await self.user_repo.db.commit()

    async def list_admin_logs(
        self,
        *,
        page: int,
        limit: int,
        admin_id: UUID | None,
        target_user_id: UUID | None,
        action: str | None,
    ) -> dict[str, Any]:
        rows, total = await self.admin_log_repo.list_logs(
            page=page,
            limit=limit,
            admin_id=admin_id,
            target_user_id=target_user_id,
            action=action,
        )
        items = [
            AdminLogRead(
                id=row.id,
                admin_id=row.admin_id,
                action=row.action,
                target_user_id=row.target_user_id,
                metadata=row.metadata_,
                created_at=row.created_at,
            ).model_dump()
            for row in rows
        ]
        return {
            "items": items,
            "pagination": pagination_meta(page=page, limit=limit, total=total),
        }

    async def _set_user_active(self, *, admin_id: UUID, user_id: UUID, is_active: bool, action: str) -> None:
        user = await self.user_repo.get_user_by_id(user_id=user_id)
        if not user:
            raise AdminServiceError("User not found", status.HTTP_404_NOT_FOUND)
        if user.role == UserRole.ADMIN:
            raise AdminServiceError("Admin user status cannot be changed", status.HTTP_403_FORBIDDEN)

        user.is_active = is_active
        await self.admin_log_repo.create_log(
            admin_id=admin_id,
            action=action,
            target_user_id=user_id,
            metadata={"is_active": is_active},
        )
        await self.user_repo.db.commit()
