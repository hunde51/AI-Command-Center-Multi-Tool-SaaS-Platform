from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


class TokenError(Exception):
    pass


def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=ALGORITHM)


def create_access_token(user_id: str, role: str) -> str:
    payload = {"user_id": user_id, "role": role, "token_type": "access"}
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    return _create_token(payload, expires)


def create_refresh_token(user_id: str, role: str) -> str:
    payload = {"user_id": user_id, "role": role, "token_type": "refresh"}
    expires = timedelta(days=settings.refresh_token_expire_days)
    return _create_token(payload, expires)


def create_action_token(user_id: str, token_type: str, expires_minutes: int) -> str:
    payload = {"user_id": user_id, "token_type": token_type}
    expires = timedelta(minutes=expires_minutes)
    return _create_token(payload, expires)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise TokenError("Invalid or expired token") from exc
