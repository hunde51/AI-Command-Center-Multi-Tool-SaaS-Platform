from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import status

from app.core.hashing import hash_password, verify_password
from app.core.jwt import (
    TokenError,
    create_access_token,
    create_action_token,
    create_refresh_token,
    decode_token,
)
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
        existing_email = await self.user_repo.get_user_by_email(payload.email, include_deleted=True)
        existing_username = await self.user_repo.get_user_by_username(payload.username, include_deleted=True)
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
        if not user or not user.is_active:
            raise AuthError("Invalid credentials", status.HTTP_401_UNAUTHORIZED)
        if user.lock_until and user.lock_until > datetime.now(timezone.utc):
            raise AuthError("Account is temporarily locked. Try again later.", status.HTTP_423_LOCKED)
        if not user.is_email_verified:
            raise AuthError("Email is not verified", status.HTTP_403_FORBIDDEN)
        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.lock_until = datetime.now(timezone.utc) + timedelta(minutes=15)
                user.failed_login_attempts = 0
            await self.user_repo.db.commit()
            raise AuthError("Invalid credentials", status.HTTP_401_UNAUTHORIZED)

        user.failed_login_attempts = 0
        user.lock_until = None
        await self.user_repo.db.commit()

        return TokenPair(
            access_token=create_access_token(str(user.id), user.role.value),
            refresh_token=create_refresh_token(str(user.id), user.role.value),
        )

    async def issue_email_verification_token(self, email: str) -> str | None:
        user = await self.user_repo.get_user_by_email(email)
        if not user or user.is_deleted or user.is_email_verified:
            return None
        return create_action_token(str(user.id), "email_verify", expires_minutes=30)

    async def verify_email(self, token: str) -> None:
        user = await self._get_user_from_action_token(token=token, expected_type="email_verify")
        user.is_email_verified = True
        await self.user_repo.db.commit()

    async def issue_password_reset_token(self, email: str) -> str | None:
        user = await self.user_repo.get_user_by_email(email)
        if not user or user.is_deleted:
            return None
        return create_action_token(str(user.id), "password_reset", expires_minutes=30)

    async def reset_password(self, token: str, new_password: str) -> None:
        user = await self._get_user_from_action_token(token=token, expected_type="password_reset")
        user.hashed_password = hash_password(new_password)
        user.failed_login_attempts = 0
        user.lock_until = None
        await self.user_repo.db.commit()

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

    async def _get_user_from_action_token(self, *, token: str, expected_type: str) -> User:
        try:
            payload = decode_token(token)
        except TokenError as exc:
            raise AuthError("Invalid or expired token", status.HTTP_401_UNAUTHORIZED) from exc

        if payload.get("token_type") != expected_type:
            raise AuthError("Invalid token type", status.HTTP_401_UNAUTHORIZED)
        user_id = payload.get("user_id")
        if not user_id:
            raise AuthError("Invalid token", status.HTTP_401_UNAUTHORIZED)

        try:
            parsed_user_id = UUID(user_id)
        except ValueError as exc:
            raise AuthError("Invalid token", status.HTTP_401_UNAUTHORIZED) from exc

        user = await self.user_repo.get_user_by_id(parsed_user_id)
        if not user or user.is_deleted:
            raise AuthError("User not found", status.HTTP_404_NOT_FOUND)
        return user
