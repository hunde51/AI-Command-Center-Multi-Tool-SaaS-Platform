from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import pytest

from app.core.hashing import hash_password
from app.models.role import UserRole
from app.services.auth_service import AuthError, AuthService


@dataclass
class DummyUser:
    id: uuid.UUID
    name: str
    email: str
    username: str
    hashed_password: str
    role: UserRole
    is_active: bool
    is_deleted: bool
    is_email_verified: bool
    failed_login_attempts: int
    lock_until: datetime | None


class DummyDB:
    async def commit(self) -> None:
        return None


class DummyUserRepo:
    def __init__(self, user: DummyUser | None) -> None:
        self.user = user
        self.db = DummyDB()

    async def get_user_by_email(self, email: str, *, include_deleted: bool = False):
        _ = include_deleted
        if self.user and self.user.email == email:
            return self.user
        return None

    async def get_user_by_id(self, user_id: uuid.UUID, *, include_deleted: bool = False):
        _ = include_deleted
        if self.user and self.user.id == user_id:
            return self.user
        return None


@pytest.mark.asyncio
async def test_login_rejects_unverified_email() -> None:
    user = DummyUser(
        id=uuid.uuid4(),
        name="User",
        email="user@example.com",
        username="user",
        hashed_password=hash_password("StrongPass123"),
        role=UserRole.USER,
        is_active=True,
        is_deleted=False,
        is_email_verified=False,
        failed_login_attempts=0,
        lock_until=None,
    )
    service = AuthService(DummyUserRepo(user))

    with pytest.raises(AuthError) as exc:
        await service.login_user("user@example.com", "StrongPass123")

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_login_locks_after_failed_attempts() -> None:
    user = DummyUser(
        id=uuid.uuid4(),
        name="User",
        email="user@example.com",
        username="user",
        hashed_password=hash_password("StrongPass123"),
        role=UserRole.USER,
        is_active=True,
        is_deleted=False,
        is_email_verified=True,
        failed_login_attempts=4,
        lock_until=None,
    )
    service = AuthService(DummyUserRepo(user))

    with pytest.raises(AuthError):
        await service.login_user("user@example.com", "bad-password")

    assert user.failed_login_attempts == 0
    assert user.lock_until is not None
    assert user.lock_until > datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_password_reset_updates_password_and_unlocks() -> None:
    user = DummyUser(
        id=uuid.uuid4(),
        name="User",
        email="user@example.com",
        username="user",
        hashed_password=hash_password("StrongPass123"),
        role=UserRole.USER,
        is_active=True,
        is_deleted=False,
        is_email_verified=True,
        failed_login_attempts=0,
        lock_until=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    service = AuthService(DummyUserRepo(user))

    token = await service.issue_password_reset_token("user@example.com")
    assert token is not None

    await service.reset_password(token, "NewStrongPass123")

    # Should login with the new password and no longer be locked.
    pair = await service.login_user("user@example.com", "NewStrongPass123")
    assert pair.access_token
