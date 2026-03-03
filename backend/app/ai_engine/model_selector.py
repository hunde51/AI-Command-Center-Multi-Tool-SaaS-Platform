from app.core.config import settings


class ModelSelector:
    """Selects model names by user plan with safe defaults."""

    def select_for_plan(self, plan: str | None) -> str:
        if plan == "enterprise":
            return settings.default_model_name
        if plan == "pro":
            return settings.default_model_name
        return settings.default_model_name
