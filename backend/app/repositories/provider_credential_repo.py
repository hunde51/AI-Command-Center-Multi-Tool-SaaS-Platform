from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.provider_credential import ProviderCredential


class ProviderCredentialRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_provider(self, *, provider: str) -> ProviderCredential | None:
        result = await self.db.execute(
            select(ProviderCredential).where(ProviderCredential.provider == provider.lower())
        )
        return result.scalar_one_or_none()

    async def upsert_active_key(
        self,
        *,
        provider: str,
        encrypted_api_key: str,
        rotated_by_admin_id,
    ) -> ProviderCredential:
        row = await self.get_by_provider(provider=provider)
        if row:
            row.encrypted_api_key = encrypted_api_key
            row.rotated_by_admin_id = rotated_by_admin_id
            row.is_active = True
            await self.db.flush()
            return row

        row = ProviderCredential(
            provider=provider.lower(),
            encrypted_api_key=encrypted_api_key,
            rotated_by_admin_id=rotated_by_admin_id,
            is_active=True,
        )
        self.db.add(row)
        await self.db.flush()
        return row
