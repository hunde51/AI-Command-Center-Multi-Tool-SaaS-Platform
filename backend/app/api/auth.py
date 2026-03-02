from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import rate_limit_placeholder
from app.db.session import get_db
from app.repositories.user_repo import UserRepository
from app.schemas.auth import AccessToken, RefreshRequest, TokenPair
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import AuthService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit_placeholder),
) -> dict:
    service = AuthService(UserRepository(db))
    user = await service.register_user(payload)
    return api_response(
        True,
        "User registered successfully",
        {"user": UserRead.model_validate(user).model_dump()},
    )


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit_placeholder),
) -> TokenPair:
    service = AuthService(UserRepository(db))
    # OAuth2PasswordRequestForm provides username/password; username is treated as email.
    return await service.login_user(form_data.username, form_data.password)


@router.post("/refresh")
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit_placeholder),
) -> dict:
    service = AuthService(UserRepository(db))
    token: AccessToken = await service.refresh_access_token(payload.refresh_token)
    return api_response(True, "Access token refreshed", token.model_dump())
