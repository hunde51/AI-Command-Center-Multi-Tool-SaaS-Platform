from __future__ import annotations

from copy import deepcopy
from typing import TypedDict
from uuid import UUID


class FeatureFlagState(TypedDict):
    key: str
    name: str
    description: str
    enabled: bool
    category: str
    updated_by: UUID | None


_DEFAULT_FLAGS: list[FeatureFlagState] = [
    {
        "key": "new_dashboard_ui",
        "name": "New Dashboard UI",
        "description": "Enable redesigned dashboard widgets and layout.",
        "enabled": True,
        "category": "frontend",
        "updated_by": None,
    },
    {
        "key": "beta_tools_catalog",
        "name": "Beta Tools Catalog",
        "description": "Expose beta AI tools in the tools section.",
        "enabled": False,
        "category": "tools",
        "updated_by": None,
    },
    {
        "key": "agent_memory_v2",
        "name": "Agent Memory v2",
        "description": "Use improved long-term memory for custom agents.",
        "enabled": False,
        "category": "agents",
        "updated_by": None,
    },
    {
        "key": "advanced_analytics",
        "name": "Advanced Analytics",
        "description": "Enable additional analytics charts and filters.",
        "enabled": True,
        "category": "analytics",
        "updated_by": None,
    },
]

_FEATURE_FLAGS: dict[str, FeatureFlagState] = {item["key"]: deepcopy(item) for item in _DEFAULT_FLAGS}


class FeatureFlagNotFoundError(Exception):
    pass


class FeatureFlagService:
    def list_flags(self) -> list[FeatureFlagState]:
        return [deepcopy(flag) for flag in _FEATURE_FLAGS.values()]

    def update_flag(self, *, key: str, enabled: bool, updated_by: UUID) -> FeatureFlagState:
        if key not in _FEATURE_FLAGS:
            raise FeatureFlagNotFoundError(key)

        current = _FEATURE_FLAGS[key]
        current["enabled"] = enabled
        current["updated_by"] = updated_by
        return deepcopy(current)
