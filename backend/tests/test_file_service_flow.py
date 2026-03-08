from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import sys
import types
import uuid

import pytest
from app.models.role import UserRole
from app.services.file_service import FileService, FileServiceError


@dataclass
class DummyFile:
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    storage_path: str
    extracted_text: str | None = None
    analysis_jobs_executed: int = 0
    created_at: datetime = datetime.now(timezone.utc)


class DummyRepo:
    def __init__(self) -> None:
        self.db = self
        self.rows: list[DummyFile] = []

    async def commit(self) -> None:
        return None

    async def refresh(self, row) -> None:
        return None

    async def create_file_document(self, *, user_id, filename, file_type, file_size, storage_path):
        row = DummyFile(
            id=uuid.uuid4(),
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            storage_path=storage_path,
        )
        self.rows.append(row)
        return row

    async def list_user_files(self, *, user_id):
        return [r for r in self.rows if r.user_id == user_id]


class DummyUser:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.role = UserRole.USER


class DummyUpload:
    def __init__(self, filename: str, content: bytes) -> None:
        self.filename = filename
        self._buf = BytesIO(content)

    async def read(self) -> bytes:
        return self._buf.getvalue()


def _make_upload(name: str, content: bytes) -> DummyUpload:
    return DummyUpload(filename=name, content=content)


@pytest.mark.asyncio
async def test_upload_file_saves_and_enqueues(monkeypatch, tmp_path: Path) -> None:
    queued: list[str] = []

    def fake_delay(file_id: str) -> None:
        queued.append(file_id)

    fake_tasks_module = types.SimpleNamespace(
        extract_file_text=types.SimpleNamespace(delay=fake_delay)
    )
    monkeypatch.setitem(sys.modules, "app.background.tasks", fake_tasks_module)

    repo = DummyRepo()
    service = FileService(file_repo=repo, upload_root=str(tmp_path), max_bytes=1024 * 1024)

    row = await service.upload_file(current_user=DummyUser(), file=_make_upload("note.txt", b"hello"))

    assert row.file_type == "txt"
    assert len(queued) == 1
    assert Path(row.storage_path).exists()


@pytest.mark.asyncio
async def test_upload_rejects_invalid_type(tmp_path: Path) -> None:
    repo = DummyRepo()
    service = FileService(file_repo=repo, upload_root=str(tmp_path), max_bytes=1024)

    with pytest.raises(FileServiceError) as exc:
        await service.upload_file(current_user=DummyUser(), file=_make_upload("bad.exe", b"x"))

    assert exc.value.status_code == 415
