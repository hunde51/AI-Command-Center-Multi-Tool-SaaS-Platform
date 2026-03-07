from __future__ import annotations

import logging

import httpx

from app.ai_engine.base import AIProvider, AIProviderError
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    def __init__(self, timeout_seconds: float = 30.0) -> None:
        self.timeout_seconds = timeout_seconds
        self.base_url = "https://api.openai.com/v1/chat/completions"

    async def generate_response(
        self,
        *,
        model: str,
        prompt: str,
        messages: list[dict[str, str]] | None = None,
        api_key: str | None = None,
    ) -> dict:
        headers = {
            "Authorization": f"Bearer {api_key or settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        chat_messages = messages or [{"role": "user", "content": prompt}]
        formatted_messages = [{"role": "system", "content": "You are a helpful AI assistant."}]
        for item in chat_messages:
            if item["role"] == "assistant":
                formatted_messages.append({"role": "assistant", "content": item["content"]})
            elif item["role"] == "user":
                formatted_messages.append({"role": "user", "content": item["content"]})

        payload = {
            "model": model,
            "messages": formatted_messages,
            "max_tokens": settings.max_tokens_limit,
        }

        last_error: Exception | None = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                body = response.json()
                content = body["choices"][0]["message"]["content"].strip()
                return {
                    "content": content,
                    "model_used": body.get("model", model),
                    "usage": self.calculate_tokens(body),
                }
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.exception("OpenAI call failed on attempt %s", attempt + 1)

        if last_error is None:
            last_error = RuntimeError("Unknown AI provider error")
        raise self.handle_errors(last_error)

    def calculate_tokens(self, response_payload: dict) -> dict:
        usage = response_payload.get("usage", {})
        return {
            "prompt_tokens": int(usage.get("prompt_tokens", 0)),
            "completion_tokens": int(usage.get("completion_tokens", 0)),
            "total_tokens": int(usage.get("total_tokens", 0)),
        }

    def handle_errors(self, exc: Exception) -> AIProviderError:
        if isinstance(exc, httpx.TimeoutException):
            return AIProviderError("AI provider request timed out")
        if isinstance(exc, httpx.HTTPStatusError):
            return AIProviderError("AI provider request failed")
        return AIProviderError("AI provider is unavailable")
