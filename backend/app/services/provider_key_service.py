from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.secret_crypto import decrypt_secret, encrypt_secret, mask_secret
from app.repositories.provider_credential_repo import ProviderCredentialRepository


class ProviderKeyService:
    _cache: dict[str, tuple[str, datetime]] = {}
    _ttl_seconds = 60

    def __init__(self, repo: ProviderCredentialRepository) -> None:
        self.repo = repo

    async def resolve_api_key(self, *, provider: str) -> str | None:
        provider_name = provider.lower()
        now = datetime.now(tz=timezone.utc)
        cached = self._cache.get(provider_name)
        if cached and cached[1] > now:
            return cached[0]

        row = await self.repo.get_by_provider(provider=provider_name)
        if row and row.is_active:
            key = decrypt_secret(row.encrypted_api_key)
            self._cache[provider_name] = (key, now + timedelta(seconds=self._ttl_seconds))
            return key

        if provider_name == "openai":
            fallback = settings.openai_api_key
        elif provider_name == "gemini":
            fallback = settings.gemini_api_key
        else:
            fallback = None
        if fallback:
            self._cache[provider_name] = (fallback, now + timedelta(seconds=self._ttl_seconds))
        return fallback

    async def set_provider_key(self, *, provider: str, raw_api_key: str, rotated_by_admin_id):
        encrypted = encrypt_secret(raw_api_key.strip())
        row = await self.repo.upsert_active_key(
            provider=provider.lower(),
            encrypted_api_key=encrypted,
            rotated_by_admin_id=rotated_by_admin_id,
        )
        self.invalidate_cache(provider=provider)
        return row

    def invalidate_cache(self, *, provider: str) -> None:
        self._cache.pop(provider.lower(), None)

    async def get_masked_provider_key(self, *, provider: str) -> str | None:
        row = await self.repo.get_by_provider(provider=provider.lower())
        if not row:
            return None
        return mask_secret(decrypt_secret(row.encrypted_api_key))
