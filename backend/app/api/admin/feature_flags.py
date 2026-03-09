from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.admin_log_repo import AdminLogRepository
from app.schemas.admin import FeatureFlagRead, FeatureFlagUpdateRequest
from app.services.feature_flag_service import FeatureFlagNotFoundError, FeatureFlagService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/feature-flags", tags=["admin-feature-flags"])
service = FeatureFlagService()


@router.get("")
async def list_feature_flags(current_user: User = Depends(require_admin)) -> dict:
    _ = current_user
    flags = [FeatureFlagRead(**row).model_dump() for row in service.list_flags()]
    return api_response(True, "Feature flags fetched", {"items": flags})


@router.patch("/{flag_key}")
async def update_feature_flag(
    flag_key: str,
    payload: FeatureFlagUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        updated = service.update_flag(key=flag_key, enabled=payload.enabled, updated_by=current_user.id)
    except FeatureFlagNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature flag not found") from exc

    admin_log_repo = AdminLogRepository(db)
    await admin_log_repo.create_log(
        admin_id=current_user.id,
        action="feature_flag_updated",
        target_user_id=None,
        metadata={"flag_key": flag_key, "enabled": payload.enabled},
    )
    await db.commit()

    return api_response(True, "Feature flag updated", {"item": FeatureFlagRead(**updated).model_dump()})
