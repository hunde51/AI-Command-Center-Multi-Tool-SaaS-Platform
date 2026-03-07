from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.admin_log_repo import AdminLogRepository
from app.repositories.provider_credential_repo import ProviderCredentialRepository
from app.schemas.admin import ProviderKeyRead, ProviderKeyUpsertRequest
from app.services.admin_service import AdminUserService
from app.services.provider_key_service import ProviderKeyService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/provider-keys", tags=["admin-provider-keys"])


def _key_service(db: AsyncSession) -> ProviderKeyService:
    return ProviderKeyService(ProviderCredentialRepository(db))


def _admin_service(db: AsyncSession) -> AdminUserService:
    from app.repositories.user_repo import UserRepository

    return AdminUserService(UserRepository(db), AdminLogRepository(db))


@router.get("/{provider}")
async def get_provider_key(
    provider: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    masked = await _key_service(db).get_masked_provider_key(provider=provider)
    _ = current_user
    payload = ProviderKeyRead(
        provider=provider.lower(),
        masked_api_key=masked,
        has_database_key=masked is not None,
    )
    return api_response(True, "Provider key fetched", payload.model_dump())


@router.put("/{provider}")
async def upsert_provider_key(
    provider: str,
    payload: ProviderKeyUpsertRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    provider_name = provider.lower()
    if payload.provider.lower() != provider_name:
        return api_response(False, "Provider mismatch between path and body", {})

    await _key_service(db).set_provider_key(
        provider=provider_name,
        raw_api_key=payload.api_key,
        rotated_by_admin_id=current_user.id,
    )
    await db.commit()
    await _admin_service(db).create_admin_log(
        admin_id=current_user.id,
        action="provider_key_rotated",
        target_user_id=None,
        metadata={"provider": provider_name, "reason": payload.reason or "manual rotation"},
    )
    return api_response(True, "Provider key updated", {"provider": provider_name})
