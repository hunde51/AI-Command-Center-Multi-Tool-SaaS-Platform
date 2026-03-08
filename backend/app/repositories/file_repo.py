from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_document import FileDocument


class FileRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_file_document(
        self,
        *,
        user_id: UUID,
        filename: str,
        file_type: str,
        file_size: int,
        storage_path: str,
    ) -> FileDocument:
        row = FileDocument(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            storage_path=storage_path,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def get_file_document(self, *, file_id: UUID) -> FileDocument | None:
        result = await self.db.execute(select(FileDocument).where(FileDocument.id == file_id))
        return result.scalar_one_or_none()

    async def list_user_files(self, *, user_id: UUID) -> list[FileDocument]:
        result = await self.db.execute(
            select(FileDocument)
            .where(FileDocument.user_id == user_id)
            .order_by(FileDocument.created_at.desc())
        )
        return list(result.scalars().all())
