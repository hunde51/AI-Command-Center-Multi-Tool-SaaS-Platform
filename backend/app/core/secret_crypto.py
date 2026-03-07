from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _build_fernet() -> Fernet:
    source = (settings.jwt_secret_key or "").encode("utf-8")
    digest = hashlib.sha256(source).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_secret(value: str) -> str:
    return _build_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str:
    try:
        return _build_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Unable to decrypt secret") from exc


def mask_secret(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) <= 6:
        return "*" * len(cleaned)
    return f"{cleaned[:2]}{'*' * (len(cleaned) - 6)}{cleaned[-4:]}"
