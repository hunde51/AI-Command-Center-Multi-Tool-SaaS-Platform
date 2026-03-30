from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserRead, UserSelfUpdate
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)) -> dict:
	return api_response(True, "User profile fetched", {"user": UserRead.model_validate(current_user).model_dump()})


@router.patch("/me")
async def update_me(
	payload: UserSelfUpdate,
	db: AsyncSession = Depends(get_db),
	current_user: User = Depends(get_current_active_user),
) -> dict:
	user_repo = UserRepository(db)

	if payload.email and payload.email != current_user.email:
		existing = await user_repo.get_user_by_email(payload.email, include_deleted=True)
		if existing and existing.id != current_user.id:
			return api_response(False, "Email is already in use", {})

	if payload.name is not None:
		current_user.name = payload.name
	if payload.email is not None:
		current_user.email = payload.email

	await db.commit()
	await db.refresh(current_user)

	return api_response(True, "Profile updated", {"user": UserRead.model_validate(current_user).model_dump()})


@router.delete("/me")
async def delete_me(
	db: AsyncSession = Depends(get_db),
	current_user: User = Depends(get_current_active_user),
) -> dict:
	current_user.is_deleted = True
	current_user.is_active = False
	await db.commit()
	return api_response(True, "Account deleted", {})
