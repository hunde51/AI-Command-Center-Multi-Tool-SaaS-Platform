from __future__ import annotations

import logging

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
        base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        url = f"{base_url}?key={settings.gemini_api_key}"

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
            "generationConfig": {
                "maxOutputTokens": settings.max_tokens_limit,
            },
        }

        last_error: Exception | None = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    response = await client.post(url, json=payload)
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
                    "model_used": model,
                    "usage": self.calculate_tokens(body),
                }
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.exception("Gemini call failed on attempt %s", attempt + 1)

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
            return AIProviderError("AI provider request failed")
        return AIProviderError("AI provider is unavailable")
