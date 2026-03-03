from __future__ import annotations

from abc import ABC, abstractmethod


class AIProviderError(Exception):
    """Raised when the AI provider cannot generate a valid response."""


class AIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        *,
        model: str,
        prompt: str,
        messages: list[dict[str, str]] | None = None,
    ) -> dict:
        """Generate a response from a provider.

        Returns a dict with keys: content, model_used, usage.
        """

    @abstractmethod
    def calculate_tokens(self, response_payload: dict) -> dict:
        """Extract token usage from a provider response payload."""

    @abstractmethod
    def handle_errors(self, exc: Exception) -> AIProviderError:
        """Normalize provider exceptions to a safe app-level error."""
