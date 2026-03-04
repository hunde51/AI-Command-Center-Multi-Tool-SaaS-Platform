from __future__ import annotations

import re
from fastapi import status
from uuid import UUID

from app.ai_engine.base import AIProvider, AIProviderError
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.token_tracker import TokenTracker
from app.models.user import User
from app.repositories.chat_repo import ChatRepository
from app.schemas.chat import ChatResponse, ConversationHistoryResponse, ConversationRead, MessageRead, UsageRead


class ChatError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository,
        provider: AIProvider,
        model_selector: ModelSelector,
        token_tracker: TokenTracker,
    ) -> None:
        self.chat_repo = chat_repo
        self.provider = provider
        self.model_selector = model_selector
        self.token_tracker = token_tracker

    async def send_message(
        self,
        *,
        current_user: User,
        message: str,
        conversation_id: UUID | None,
    ) -> ChatResponse:
        if not current_user.is_active:
            raise ChatError("Inactive user", status.HTTP_403_FORBIDDEN)

        conversation = None
        if conversation_id is not None:
            conversation = await self.chat_repo.get_conversation_by_id(conversation_id=conversation_id)
            if not conversation or conversation.user_id != current_user.id:
                raise ChatError("Conversation not found", status.HTTP_404_NOT_FOUND)
        if conversation is None:
            title = self._build_conversation_title(message)
            conversation = await self.chat_repo.create_conversation(user_id=current_user.id, title=title)

        cost_estimate = 0.0
        try:
            existing_messages = await self.chat_repo.get_messages_by_conversation(
                conversation_id=conversation.id
            )
            user_message = await self.chat_repo.create_message(
                conversation_id=conversation.id,
                role="user",
                content=message,
                token_count=0,
            )

            model_name = self.model_selector.select_for_plan(None)
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in existing_messages
                if msg.role in {"user", "assistant"}
            ]
            history.append({"role": "user", "content": message})
            ai_result = await self.provider.generate_response(
                model=model_name,
                prompt=message,
                messages=history,
            )
            usage = ai_result["usage"]
            assistant_content = ai_result["content"]
            assistant_message = await self.chat_repo.create_message(
                conversation_id=conversation.id,
                role="assistant",
                content=assistant_content,
                token_count=int(usage.get("completion_tokens", 0)),
            )

            await self.token_tracker.track(
                user_id=current_user.id,
                model_used=ai_result["model_used"],
                usage=usage,
                cost_estimate=cost_estimate,
            )

            await self.chat_repo.db.commit()
            await self.chat_repo.db.refresh(conversation)
            await self.chat_repo.db.refresh(user_message)
            await self.chat_repo.db.refresh(assistant_message)
        except AIProviderError as exc:
            await self.chat_repo.db.rollback()
            raise ChatError(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE) from exc
        except Exception:
            await self.chat_repo.db.rollback()
            raise

        usage_stats = self.token_tracker.usage_stats(usage)
        return ChatResponse(
            conversation=ConversationRead.model_validate(conversation),
            user_message=MessageRead.model_validate(user_message),
            assistant_message=MessageRead.model_validate(assistant_message),
            usage=UsageRead(
                model_used=ai_result["model_used"],
                prompt_tokens=usage_stats["prompt_tokens"],
                completion_tokens=usage_stats["completion_tokens"],
                total_tokens=usage_stats["total_tokens"],
                cost_estimate=cost_estimate,
            ),
        )

    async def get_user_conversations(self, *, current_user: User) -> list[ConversationRead]:
        rows = await self.chat_repo.get_user_conversations(user_id=current_user.id)
        return [ConversationRead.model_validate(item) for item in rows]

    async def get_conversation_history(
        self,
        *,
        current_user: User,
        conversation_id: UUID,
    ) -> ConversationHistoryResponse:
        conversation = await self.chat_repo.get_conversation_by_id(conversation_id=conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise ChatError("Conversation not found", status.HTTP_404_NOT_FOUND)

        messages = await self.chat_repo.get_messages_by_conversation(conversation_id=conversation_id)
        return ConversationHistoryResponse(
            conversation=ConversationRead.model_validate(conversation),
            messages=[MessageRead.model_validate(msg) for msg in messages],
        )

    async def rename_conversation(
        self,
        *,
        current_user: User,
        conversation_id: UUID,
        title: str,
    ) -> ConversationRead:
        conversation = await self.chat_repo.get_conversation_by_id(conversation_id=conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise ChatError("Conversation not found", status.HTTP_404_NOT_FOUND)
        await self.chat_repo.update_conversation_title(conversation=conversation, title=title.strip())
        await self.chat_repo.db.commit()
        await self.chat_repo.db.refresh(conversation)
        return ConversationRead.model_validate(conversation)

    async def delete_conversation(self, *, current_user: User, conversation_id: UUID) -> None:
        conversation = await self.chat_repo.get_conversation_by_id(conversation_id=conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise ChatError("Conversation not found", status.HTTP_404_NOT_FOUND)
        await self.chat_repo.delete_conversation(conversation=conversation)
        await self.chat_repo.db.commit()

    def _build_conversation_title(self, message: str) -> str:
        tokens = re.findall(r"[A-Za-z0-9']+", message.lower())
        stopwords = {
            "the", "a", "an", "and", "or", "to", "for", "with", "of", "on", "in",
            "is", "are", "be", "can", "you", "i", "me", "my", "we", "our", "it",
            "this", "that", "about", "help", "please",
        }
        keywords: list[str] = []
        for token in tokens:
            if len(token) < 3 or token in stopwords:
                continue
            if token not in keywords:
                keywords.append(token)
            if len(keywords) == 6:
                break
        if keywords:
            return " ".join(word.capitalize() for word in keywords)
        fallback = message.strip()
        if not fallback:
            return "New Conversation"
        return fallback[:60]
