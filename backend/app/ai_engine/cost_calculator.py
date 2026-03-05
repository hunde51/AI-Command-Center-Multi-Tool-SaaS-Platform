from __future__ import annotations


class CostCalculator:
    """Simple token-based estimator; can be replaced with provider pricing table later."""

    def estimate(self, *, model_name: str, total_tokens: int) -> float:
        per_1k = self._usd_per_1k_tokens(model_name=model_name)
        return round((max(total_tokens, 0) / 1000.0) * per_1k, 6)

    def _usd_per_1k_tokens(self, *, model_name: str) -> float:
        lowered = model_name.lower()
        if "gemini" in lowered:
            return 0.001
        if "gpt-4" in lowered:
            return 0.02
        if "gpt" in lowered:
            return 0.005
        return 0.003
