from __future__ import annotations

from uuid import UUID

from app.repositories.usage_repo import UsageRepository


class TokenTracker:
    def __init__(self, usage_repo: UsageRepository) -> None:
        self.usage_repo = usage_repo

    async def track(
        self,
        *,
        user_id: UUID,
        model_used: str,
        usage: dict,
        cost_estimate: float,
    ) -> None:
        tokens_used = int(usage.get("total_tokens", 0))
        await self.usage_repo.log_usage(
            user_id=user_id,
            model_used=model_used,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )

    def usage_stats(self, usage: dict) -> dict:
        return {
            "prompt_tokens": int(usage.get("prompt_tokens", 0)),
            "completion_tokens": int(usage.get("completion_tokens", 0)),
            "total_tokens": int(usage.get("total_tokens", 0)),
        }
