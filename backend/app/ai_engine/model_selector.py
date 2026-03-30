from app.core.config import settings
from app.models.role import UserRole


class ModelSelector:
    """Selects model names by user plan with safe defaults."""

    _allowed_by_role = {
        UserRole.ADMIN.value: {
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-3-flash",
            "gpt-4o-mini",
            "gpt-4.1-mini",
        },
        UserRole.USER.value: {
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-3-flash",
            "gpt-4o-mini",
        },
    }

    def select_for_plan(self, plan: str | None) -> str:
        if plan == "enterprise":
            return settings.default_model_name
        if plan == "pro":
            return settings.default_model_name
        return settings.default_model_name

    def is_model_allowed_for_role(self, *, model_name: str, role: str) -> bool:
        allowed = self._allowed_by_role.get(role, self._allowed_by_role[UserRole.USER.value])
        return model_name in allowed

    def list_allowed_models_for_role(self, *, role: str) -> list[str]:
        allowed = self._allowed_by_role.get(role, self._allowed_by_role[UserRole.USER.value])
        return sorted(allowed)
