from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message


class ChatRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_conversation(self, *, user_id: UUID, title: str) -> Conversation:
        conversation = Conversation(user_id=user_id, title=title)
        self.db.add(conversation)
        await self.db.flush()
        return conversation

    async def get_user_conversations(self, *, user_id: UUID) -> list[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_conversation_by_id(self, *, conversation_id: UUID) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def create_message(
        self,
        *,
        conversation_id: UUID,
        role: str,
        content: str,
        token_count: int,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            token_count=token_count,
        )
        self.db.add(message)
        await self.db.flush()
        return message

    async def get_messages_by_conversation(self, *, conversation_id: UUID) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    async def update_conversation_title(
        self,
        *,
        conversation: Conversation,
        title: str,
    ) -> Conversation:
        conversation.title = title
        await self.db.flush()
        return conversation

    async def delete_conversation(self, *, conversation: Conversation) -> None:
        await self.db.delete(conversation)
        await self.db.flush()
