from fastapi import status

from app.core.hashing import hash_password, verify_password
from app.core.jwt import TokenError, create_access_token, create_refresh_token, decode_token
from app.models.role import UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import AccessToken, TokenPair
from app.schemas.user import UserCreate


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def register_user(self, payload: UserCreate) -> User:
        existing_email = await self.user_repo.get_user_by_email(payload.email)
        existing_username = await self.user_repo.get_user_by_username(payload.username)
        if existing_email or existing_username:
            raise AuthError("Unable to process registration request")

        user = User(
            name=payload.name,
            email=payload.email,
            username=payload.username,
            hashed_password=hash_password(payload.password),
            role=UserRole.USER,
        )
        return await self.user_repo.create_user(user)

    async def login_user(self, email: str, password: str) -> TokenPair:
        user = await self.user_repo.get_user_by_email(email)
        if not user or not user.is_active or not verify_password(password, user.hashed_password):
            raise AuthError("Invalid credentials", status.HTTP_401_UNAUTHORIZED)

        return TokenPair(
            access_token=create_access_token(str(user.id), user.role.value),
            refresh_token=create_refresh_token(str(user.id), user.role.value),
        )

    async def refresh_access_token(self, refresh_token: str) -> AccessToken:
        try:
            payload = decode_token(refresh_token)
        except TokenError as exc:
            raise AuthError("Invalid or expired token", status.HTTP_401_UNAUTHORIZED) from exc
        if payload.get("token_type") != "refresh":
            raise AuthError("Invalid token type", status.HTTP_401_UNAUTHORIZED)

        user_id = payload.get("user_id")
        role = payload.get("role")
        if not user_id or not role:
            raise AuthError("Invalid token", status.HTTP_401_UNAUTHORIZED)

        return AccessToken(access_token=create_access_token(user_id, role))
