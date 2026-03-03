from app.ai_engine.base import AIProvider
from app.ai_engine.gemini_provider import GeminiProvider
from app.ai_engine.openai_provider import OpenAIProvider
from app.core.config import settings


def get_ai_provider() -> AIProvider:
    provider = settings.ai_provider.lower()
    if provider == "gemini":
        return GeminiProvider()
    if provider == "openai":
        return OpenAIProvider()
    raise ValueError("Unsupported AI_PROVIDER. Use 'openai' or 'gemini'.")
