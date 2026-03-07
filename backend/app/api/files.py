from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.file_repo import FileRepository
from app.services.file_service import FileService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/files", tags=["files"])


def _service(db: AsyncSession) -> FileService:
    return FileService(
        file_repo=FileRepository(db),
        upload_root=settings.upload_storage_dir,
        max_bytes=settings.max_upload_size_mb * 1024 * 1024,
    )


@router.post("/upload")
async def upload_file(
    uploaded_file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    row = await _service(db).upload_file(current_user=current_user, file=uploaded_file)
    return api_response(True, "File uploaded", {"file": row.model_dump()})


@router.get("")
async def list_files(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await _service(db).list_files(current_user=current_user)
    return api_response(True, "Files fetched", {"files": [r.model_dump() for r in rows]})
