from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile, status

from app.models.user import User
from app.repositories.file_repo import FileRepository
from app.schemas.file_document import FileDocumentRead


class FileServiceError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class FileService:
    ALLOWED_TYPES = {".pdf", ".docx", ".txt"}

    def __init__(self, *, file_repo: FileRepository, upload_root: str, max_bytes: int) -> None:
        self.file_repo = file_repo
        self.upload_root = upload_root
        self.max_bytes = max_bytes

    async def upload_file(self, *, current_user: User, file: UploadFile) -> FileDocumentRead:
        filename = file.filename or "uploaded_file"
        ext = Path(filename).suffix.lower()
        if ext not in self.ALLOWED_TYPES:
            raise FileServiceError("Unsupported file type", status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

        raw = await file.read()
        size = len(raw)
        if size <= 0:
            raise FileServiceError("Empty file", status.HTTP_422_UNPROCESSABLE_ENTITY)
        if size > self.max_bytes:
            raise FileServiceError("File too large", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        user_folder = Path(self.upload_root) / str(current_user.id)
        user_folder.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid4()}_{Path(filename).name}"
        disk_path = user_folder / safe_name
        with open(disk_path, "wb") as out:
            out.write(raw)

        row = await self.file_repo.create_file_document(
            user_id=current_user.id,
            filename=filename,
            file_type=ext.lstrip("."),
            file_size=size,
            storage_path=os.fspath(disk_path),
        )
        await self.file_repo.db.commit()
        await self.file_repo.db.refresh(row)

        try:
            from app.background.tasks import extract_file_text

            extract_file_text.delay(str(row.id))
        except Exception:
            # Queueing is best-effort during local/dev bootstrap.
            pass
        return FileDocumentRead.model_validate(row)

    async def list_files(self, *, current_user: User) -> list[FileDocumentRead]:
        rows = await self.file_repo.list_user_files(user_id=current_user.id)
        return [FileDocumentRead.model_validate(r) for r in rows]
