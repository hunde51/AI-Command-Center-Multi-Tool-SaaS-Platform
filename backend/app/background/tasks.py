from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import UUID

from app.background.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.file_document import FileDocument


async def _get_file_document(file_id: UUID) -> FileDocument | None:
    async with SessionLocal() as db:
        row = await db.get(FileDocument, file_id)
        return row


async def _save_extracted_text(file_id: UUID, text: str) -> None:
    async with SessionLocal() as db:
        row = await db.get(FileDocument, file_id)
        if not row:
            return
        row.extracted_text = text
        await db.commit()


async def _increment_analysis_counter(file_id: UUID) -> None:
    async with SessionLocal() as db:
        row = await db.get(FileDocument, file_id)
        if not row:
            return
        row.analysis_jobs_executed += 1
        await db.commit()


def _extract_text_from_path(path: str) -> str:
    suffix = Path(path).suffix.lower()
    if suffix == ".txt":
        return Path(path).read_text(encoding="utf-8", errors="ignore")
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
        except Exception:
            return "PDF extraction unavailable: pypdf is not installed."
        reader = PdfReader(path)
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()
    if suffix == ".docx":
        try:
            from docx import Document
        except Exception:
            return "DOCX extraction unavailable: python-docx is not installed."
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs).strip()
    return "Unsupported file type"


@celery_app.task(name="extract_file_text")
def extract_file_text(file_id: str) -> dict:
    parsed_id = UUID(file_id)

    async def _run() -> dict:
        file_doc = await _get_file_document(parsed_id)
        if not file_doc:
            return {"ok": False, "error": "file_not_found"}
        text = _extract_text_from_path(file_doc.storage_path)
        await _save_extracted_text(parsed_id, text)
        return {"ok": True, "file_id": file_id, "chars": len(text)}

    return asyncio.run(_run())


@celery_app.task(name="summarize_document")
def summarize_document(file_id: str) -> dict:
    asyncio.run(_increment_analysis_counter(UUID(file_id)))
    return {"ok": True, "job": "summarize_document", "file_id": file_id}


@celery_app.task(name="analyze_resume")
def analyze_resume(file_id: str) -> dict:
    asyncio.run(_increment_analysis_counter(UUID(file_id)))
    return {"ok": True, "job": "analyze_resume", "file_id": file_id}


@celery_app.task(name="generate_insights")
def generate_insights(file_id: str) -> dict:
    asyncio.run(_increment_analysis_counter(UUID(file_id)))
    return {"ok": True, "job": "generate_insights", "file_id": file_id}
