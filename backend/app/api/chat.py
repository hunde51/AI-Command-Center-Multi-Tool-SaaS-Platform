from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.provider_factory import get_ai_provider
from app.ai_engine.token_tracker import TokenTracker
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.chat_repo import ChatRepository
from app.repositories.provider_credential_repo import ProviderCredentialRepository
from app.repositories.subscription_repo import SubscriptionRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.chat import ChatRequest, ConversationRenameRequest
from app.services.provider_key_service import ProviderKeyService
from app.services.chat_service import ChatService
from app.services.quota_service import QuotaService
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    chat_repo = ChatRepository(db)
    service = ChatService(
        chat_repo=chat_repo,
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        token_tracker=TokenTracker(UsageRepository(db)),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )
    result = await service.send_message(
        current_user=current_user,
        message=payload.message,
        conversation_id=payload.conversation_id,
        model_name=payload.model_name,
    )
    return api_response(True, "Message processed", result.model_dump())


@router.get("/models")
async def list_models(current_user: User = Depends(get_current_active_user)) -> dict:
    selector = ModelSelector()
    models = selector.list_allowed_models_for_role(role=current_user.role.value)
    default_model = selector.select_for_plan(None)
    if default_model not in models and models:
        default_model = models[0]
    return api_response(True, "Chat models fetched", {"models": models, "default_model": default_model})


@router.get("/health/provider")
async def provider_health(
    current_user: User = Depends(get_current_active_user),
) -> dict:
    provider = get_ai_provider()
    model_name = ModelSelector().select_for_plan(None)
    result = await provider.generate_response(
        model=model_name,
        prompt="Respond with: ok",
        messages=[{"role": "user", "content": "Respond with: ok"}],
    )
    return api_response(
        True,
        "Provider is reachable",
        {
            "provider": provider.__class__.__name__,
            "model": model_name,
            "checked_by_user_id": str(current_user.id),
            "usage": result["usage"],
            "preview": result["content"][:80],
        },
    )


@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ChatService(
        chat_repo=ChatRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        token_tracker=TokenTracker(UsageRepository(db)),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )
    rows = await service.get_user_conversations(current_user=current_user)
    return api_response(True, "Conversations fetched", {"conversations": [r.model_dump() for r in rows]})


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ChatService(
        chat_repo=ChatRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        token_tracker=TokenTracker(UsageRepository(db)),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )
    result = await service.get_conversation_history(
        current_user=current_user,
        conversation_id=conversation_id,
    )
    return api_response(True, "Conversation fetched", result.model_dump())


@router.patch("/{conversation_id}")
async def rename_conversation(
    conversation_id: UUID,
    payload: ConversationRenameRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ChatService(
        chat_repo=ChatRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        token_tracker=TokenTracker(UsageRepository(db)),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )
    updated = await service.rename_conversation(
        current_user=current_user,
        conversation_id=conversation_id,
        title=payload.title,
    )
    return api_response(True, "Conversation renamed", {"conversation": updated.model_dump()})


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ChatService(
        chat_repo=ChatRepository(db),
        provider=get_ai_provider(),
        model_selector=ModelSelector(),
        token_tracker=TokenTracker(UsageRepository(db)),
        provider_key_service=ProviderKeyService(ProviderCredentialRepository(db)),
        quota_service=QuotaService(SubscriptionRepository(db)),
    )
    await service.delete_conversation(current_user=current_user, conversation_id=conversation_id)
    return api_response(True, "Conversation deleted", {})
