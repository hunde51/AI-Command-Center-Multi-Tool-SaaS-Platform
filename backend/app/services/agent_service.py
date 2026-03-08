from __future__ import annotations

from fastapi import status
from uuid import UUID

from app.ai_engine.base import AIProvider, AIProviderError
from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.response_cleaner import clean_assistant_text
from app.models.user import User
from app.repositories.agent_repo import AgentRepository
from app.repositories.chat_repo import ChatRepository
from app.repositories.usage_repo import UsageRepository
from app.schemas.agent import AgentChatResponse, AgentRead
from app.services.quota_service import QuotaExceededError, QuotaService


class AgentServiceError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AgentService:
    def __init__(
        self,
        *,
        agent_repo: AgentRepository,
        chat_repo: ChatRepository,
        usage_repo: UsageRepository,
        provider: AIProvider,
        model_selector: ModelSelector,
        cost_calculator: CostCalculator,
        quota_service: QuotaService,
    ) -> None:
        self.agent_repo = agent_repo
        self.chat_repo = chat_repo
        self.usage_repo = usage_repo
        self.provider = provider
        self.model_selector = model_selector
        self.cost_calculator = cost_calculator
        self.quota_service = quota_service

    async def create_agent(self, *, current_user: User, name: str, description: str, system_prompt: str, knowledge_base_id, is_active: bool) -> AgentRead:
        row = await self.agent_repo.create_agent(
            user_id=current_user.id,
            name=name.strip(),
            description=description.strip(),
            system_prompt=system_prompt.strip(),
            knowledge_base_id=knowledge_base_id,
            is_active=is_active,
        )
        await self.agent_repo.db.commit()
        await self.agent_repo.db.refresh(row)
        return AgentRead.model_validate(row)

    async def list_user_agents(self, *, current_user: User) -> list[AgentRead]:
        rows = await self.agent_repo.list_user_agents(user_id=current_user.id)
        return [AgentRead.model_validate(r) for r in rows]

    async def update_agent(self, *, current_user: User, agent_id: UUID, name: str, description: str, system_prompt: str, knowledge_base_id, is_active: bool) -> AgentRead:
        row = await self.agent_repo.get_agent_by_id(agent_id=agent_id)
        if not row or row.user_id != current_user.id:
            raise AgentServiceError("Agent not found", status.HTTP_404_NOT_FOUND)
        row = await self.agent_repo.update_agent(
            agent=row,
            name=name.strip(),
            description=description.strip(),
            system_prompt=system_prompt.strip(),
            knowledge_base_id=knowledge_base_id,
            is_active=is_active,
        )
        await self.agent_repo.db.commit()
        await self.agent_repo.db.refresh(row)
        return AgentRead.model_validate(row)

    async def delete_agent(self, *, current_user: User, agent_id: UUID) -> None:
        row = await self.agent_repo.get_agent_by_id(agent_id=agent_id)
        if not row or row.user_id != current_user.id:
            raise AgentServiceError("Agent not found", status.HTTP_404_NOT_FOUND)
        await self.agent_repo.delete_agent(agent=row)
        await self.agent_repo.db.commit()

    async def chat_with_agent(self, *, current_user: User, agent_id: UUID, message: str) -> AgentChatResponse:
        row = await self.agent_repo.get_agent_by_id(agent_id=agent_id)
        if not row or row.user_id != current_user.id:
            raise AgentServiceError("Agent not found", status.HTTP_404_NOT_FOUND)
        if not row.is_active:
            raise AgentServiceError("Agent is not active", status.HTTP_403_FORBIDDEN)

        combined_prompt = f"{row.system_prompt.strip()}\n\nUser request:\n{message.strip()}"
        model_name = self.model_selector.select_for_plan(None)

        try:
            await self.quota_service.ensure_allowed(user_id=current_user.id, requested_tokens=max(100, len(combined_prompt) // 3))
            ai_result = await self.provider.generate_response(
                model=model_name,
                prompt=combined_prompt,
                messages=[{"role": "user", "content": combined_prompt}],
            )
        except QuotaExceededError as exc:
            await self.agent_repo.db.rollback()
            raise AgentServiceError(exc.message, exc.status_code) from exc
        except AIProviderError as exc:
            await self.agent_repo.db.rollback()
            raise AgentServiceError(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE) from exc

        usage = ai_result["usage"]
        tokens_used = int(usage.get("total_tokens", 0))
        cost_estimate = self.cost_calculator.estimate(
            model_name=ai_result["model_used"],
            total_tokens=tokens_used,
        )

        conversation = await self.chat_repo.create_conversation(
            user_id=current_user.id,
            title=f"Agent: {row.name}",
        )
        await self.chat_repo.create_message(
            conversation_id=conversation.id,
            role="user",
            content=message.strip(),
            token_count=0,
        )
        assistant_content = clean_assistant_text(ai_result["content"])
        await self.chat_repo.create_message(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_content,
            token_count=int(usage.get("completion_tokens", 0)),
        )

        await self.agent_repo.create_agent_usage(
            agent_id=row.id,
            user_id=current_user.id,
            tokens_used=tokens_used,
        )
        await self.usage_repo.log_usage(
            user_id=current_user.id,
            model_used=ai_result["model_used"],
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
        await self.quota_service.consume(user_id=current_user.id, tokens_used=tokens_used)
        await self.agent_repo.db.commit()

        return AgentChatResponse(
            agent=AgentRead.model_validate(row),
            output=assistant_content,
            model_used=ai_result["model_used"],
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
