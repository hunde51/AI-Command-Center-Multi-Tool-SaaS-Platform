from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.subscription_repo import SubscriptionRepository
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/pricing", tags=["pricing"])


def _price_label(value: Decimal) -> str:
    as_float = float(value)
    if as_float == 0:
        return "$0"
    if as_float.is_integer():
        return f"${int(as_float)}"
    return f"${as_float:.2f}"


def _cta_for_plan(name: str) -> str:
    lowered = name.lower()
    if "free" in lowered:
        return "Get Started"
    if "enterprise" in lowered:
        return "Contact Sales"
    return "Start Free Trial"


def _description_for_plan(name: str) -> str:
    lowered = name.lower()
    if "free" in lowered:
        return "Perfect for exploring AI capabilities"
    if "enterprise" in lowered:
        return "For teams that need enterprise-grade AI"
    return "For professionals who need more power"


def _extra_features_for_plan(name: str) -> list[str]:
    lowered = name.lower()
    if "free" in lowered:
        return ["Basic AI chat", "Community support"]
    if "enterprise" in lowered:
        return ["Dedicated support", "SLA guarantee", "Custom integrations"]
    return ["All AI models", "Priority support", "Advanced analytics"]


@router.get("/plans")
async def list_pricing_plans(db: AsyncSession = Depends(get_db)) -> dict:
    plans = await SubscriptionRepository(db).list_plans()
    if not plans:
        return api_response(True, "Pricing plans fetched", {"plans": []})

    highlighted_plan_id = next(
        (str(plan.id) for plan in plans if "pro" in plan.name.lower()),
        str(plans[len(plans) // 2].id),
    )

    payload = []
    for plan in plans:
        payload.append(
            {
                "id": str(plan.id),
                "name": plan.name,
                "price": _price_label(plan.price),
                "period": "" if "enterprise" in plan.name.lower() else "/month",
                "description": _description_for_plan(plan.name),
                "features": [
                    f"{int(plan.monthly_token_limit):,} tokens/month",
                    *_extra_features_for_plan(plan.name),
                ],
                "highlighted": str(plan.id) == highlighted_plan_id,
                "cta": _cta_for_plan(plan.name),
            }
        )

    return api_response(True, "Pricing plans fetched", {"plans": payload})
