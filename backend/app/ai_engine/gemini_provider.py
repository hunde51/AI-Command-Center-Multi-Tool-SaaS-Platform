from __future__ import annotations

import logging
import re

import httpx

from app.ai_engine.base import AIProvider, AIProviderError
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    def __init__(self, timeout_seconds: float = 30.0) -> None:
        self.timeout_seconds = timeout_seconds

    async def generate_response(
        self,
        *,
        model: str,
        prompt: str,
        messages: list[dict[str, str]] | None = None,
    ) -> dict:
        chat_messages = messages or [{"role": "user", "content": prompt}]
        contents = [
            {
                "role": "user" if m["role"] == "user" else "model",
                "parts": [{"text": m["content"]}],
            }
            for m in chat_messages
            if m["role"] in {"user", "assistant"}
        ]

        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "Respond in plain, professional English. "
                            "Do not use Markdown formatting, including bold, italics, "
                            "bullet markers, or wrapping quotation marks unless requested."
                        )
                    }
                ]
            },
            "generationConfig": {
                "maxOutputTokens": settings.max_tokens_limit,
            },
        }

        candidate_models = [model, "gemini-2.5-flash", "gemini-2.0-flash"]
        seen: set[str] = set()
        last_error: Exception | None = None

        for candidate in candidate_models:
            if candidate in seen:
                continue
            seen.add(candidate)

            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{candidate}:generateContent?key={settings.gemini_api_key}"
            )

            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                        response = await client.post(url, json=payload)

                    if response.status_code == 404:
                        logger.warning("Gemini model not found: %s", candidate)
                        break

                    response.raise_for_status()
                    body = response.json()
                    candidates = body.get("candidates", [])
                    if not candidates:
                        raise AIProviderError("AI provider returned no response")
                    parts = candidates[0].get("content", {}).get("parts", [])
                    content = "\n".join(part.get("text", "") for part in parts).strip()
                    if not content:
                        raise AIProviderError("AI provider returned empty response")
                    return {
                        "content": content,
                        "model_used": candidate,
                        "usage": self.calculate_tokens(body),
                    }
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    logger.exception(
                        "Gemini call failed on attempt %s using model %s",
                        attempt + 1,
                        candidate,
                    )

        if last_error is None:
            last_error = RuntimeError("Unknown AI provider error")
        raise self.handle_errors(last_error)

    def calculate_tokens(self, response_payload: dict) -> dict:
        usage = response_payload.get("usageMetadata", {})
        prompt_tokens = int(usage.get("promptTokenCount", 0))
        completion_tokens = int(usage.get("candidatesTokenCount", 0))
        total_tokens = int(usage.get("totalTokenCount", prompt_tokens + completion_tokens))
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
        }

    def handle_errors(self, exc: Exception) -> AIProviderError:
        if isinstance(exc, AIProviderError):
            return exc
        if isinstance(exc, httpx.TimeoutException):
            return AIProviderError("AI provider request timed out")
        if isinstance(exc, httpx.HTTPStatusError):
            status_code = exc.response.status_code
            detail = ""
            try:
                payload = exc.response.json()
                detail = payload.get("error", {}).get("message", "")
            except Exception:  # noqa: BLE001
                detail = exc.response.text[:200]
            if status_code == 429:
                retry_match = re.search(r"retry in ([0-9.]+)s", detail, flags=re.IGNORECASE)
                retry_hint = (
                    f" Retry after ~{retry_match.group(1)}s."
                    if retry_match
                    else ""
                )
                return AIProviderError(
                    "Gemini quota/rate limit reached (HTTP 429). "
                    "Check Gemini API billing and quotas for your key/project,"
                    " or switch provider/model." + retry_hint
                )
            if detail:
                return AIProviderError(f"AI provider request failed ({status_code}): {detail}")
            return AIProviderError(f"AI provider request failed ({status_code})")
        return AIProviderError("AI provider is unavailable")
