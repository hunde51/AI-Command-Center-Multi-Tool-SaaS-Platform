from __future__ import annotations

import re
from fastapi import status
from uuid import UUID

from app.ai_engine.base import AIProvider, AIProviderError
from app.ai_engine.cost_calculator import CostCalculator
from app.ai_engine.model_selector import ModelSelector
from app.ai_engine.response_cleaner import clean_assistant_text
from app.repositories.tool_repo import ToolRepository
from app.repositories.usage_repo import UsageRepository
from app.services.provider_key_service import ProviderKeyService
from app.schemas.tool import ToolExecutionRead, ToolRead, ToolUsageRead


class ToolServiceError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ToolService:
    def __init__(
        self,
        *,
        tool_repo: ToolRepository,
        usage_repo: UsageRepository,
        provider: AIProvider,
        model_selector: ModelSelector,
        cost_calculator: CostCalculator,
        provider_key_service: ProviderKeyService | None = None,
    ) -> None:
        self.tool_repo = tool_repo
        self.usage_repo = usage_repo
        self.provider = provider
        self.model_selector = model_selector
        self.cost_calculator = cost_calculator
        self.provider_key_service = provider_key_service

    async def execute_tool(self, slug: str, user_input: str, user_id: UUID) -> ToolExecutionRead:
        tool = await self.tool_repo.get_tool_by_slug(slug=slug)
        if not tool:
            raise ToolServiceError("Tool not found", status.HTTP_404_NOT_FOUND)
        if not tool.is_active:
            raise ToolServiceError("Tool is not active", status.HTTP_403_FORBIDDEN)
        self._validate_input(user_input=user_input, input_schema=tool.input_schema or {})

        rendered_prompt = self._render_prompt(
            template=tool.system_prompt_template,
            user_input=user_input,
        )
        model_name = tool.model_name or self.model_selector.select_for_plan(None)
        api_key = None
        if self.provider_key_service is not None:
            provider_name = self.provider.__class__.__name__.replace("Provider", "").lower()
            api_key = await self.provider_key_service.resolve_api_key(provider=provider_name)
        try:
            ai_result = await self.provider.generate_response(
                model=model_name,
                prompt=rendered_prompt,
                messages=[{"role": "user", "content": rendered_prompt}],
                api_key=api_key,
            )
        except AIProviderError as exc:
            await self.tool_repo.db.rollback()
            raise ToolServiceError(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE) from exc

        usage = ai_result["usage"]
        tokens_used = int(usage.get("total_tokens", 0))
        cost_estimate = self.cost_calculator.estimate(
            model_name=ai_result["model_used"],
            total_tokens=tokens_used,
        )

        await self.tool_repo.create_tool_usage(
            tool_id=tool.id,
            user_id=user_id,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
        await self.usage_repo.log_usage(
            user_id=user_id,
            model_used=ai_result["model_used"],
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
        )
        await self.tool_repo.db.commit()

        return ToolExecutionRead(
            tool=ToolRead.model_validate(tool),
            output=clean_assistant_text(ai_result["content"]),
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
            model_used=ai_result["model_used"],
        )

    async def get_user_tool_history(self, user_id: UUID) -> list[ToolUsageRead]:
        rows = await self.tool_repo.get_user_tool_history(user_id=user_id)
        return [
            ToolUsageRead(
                id=row.id,
                tool_id=row.tool_id,
                tool_slug=row.tool.slug if row.tool else "",
                tool_name=row.tool.name if row.tool else "Unknown Tool",
                tokens_used=row.tokens_used,
                cost_estimate=row.cost_estimate,
                created_at=row.created_at,
            )
            for row in rows
        ]

    async def list_active_tools(self) -> list[ToolRead]:
        tools = await self.tool_repo.list_active_tools()
        return [ToolRead.model_validate(t) for t in tools]

    async def list_tools(self) -> list[ToolRead]:
        tools = await self.tool_repo.list_tools()
        return [ToolRead.model_validate(t) for t in tools]

    async def create_tool(
        self,
        *,
        name: str,
        slug: str,
        description: str,
        system_prompt_template: str,
        model_name: str,
        input_schema: dict,
        admin_locked: bool,
        is_active: bool,
        version: int,
        created_by_user_id: UUID,
        actor_role: str,
    ) -> ToolRead:
        existing = await self.tool_repo.get_tool_by_slug(slug=slug)
        if existing:
            raise ToolServiceError("Tool slug already exists", status.HTTP_409_CONFLICT)
        self._validate_model_access(model_name=model_name, actor_role=actor_role)

        tool = await self.tool_repo.create_tool(
            name=name.strip(),
            slug=slug.strip(),
            description=description.strip(),
            system_prompt_template=system_prompt_template.strip(),
            model_name=model_name.strip(),
            input_schema=input_schema,
            admin_locked=admin_locked,
            created_by_user_id=created_by_user_id,
            is_active=is_active,
            version=version,
        )
        await self.tool_repo.db.commit()
        await self.tool_repo.db.refresh(tool)
        return ToolRead.model_validate(tool)

    async def update_tool(
        self,
        *,
        tool_id: UUID,
        name: str,
        slug: str,
        description: str,
        system_prompt_template: str,
        model_name: str,
        input_schema: dict,
        admin_locked: bool,
        is_active: bool,
        version: int,
        actor_id: UUID,
        actor_role: str,
    ) -> ToolRead:
        tool = await self.tool_repo.get_tool_by_id(tool_id=tool_id)
        if not tool:
            raise ToolServiceError("Tool not found", status.HTTP_404_NOT_FOUND)
        if actor_role != "ADMIN":
            if tool.admin_locked:
                raise ToolServiceError("Tool is admin-locked", status.HTTP_403_FORBIDDEN)
            if tool.created_by_user_id != actor_id:
                raise ToolServiceError("Not allowed to modify this tool", status.HTTP_403_FORBIDDEN)

        other = await self.tool_repo.get_tool_by_slug(slug=slug)
        if other and other.id != tool.id:
            raise ToolServiceError("Tool slug already exists", status.HTTP_409_CONFLICT)
        self._validate_model_access(model_name=model_name, actor_role=actor_role)

        tool = await self.tool_repo.update_tool(
            tool=tool,
            name=name.strip(),
            slug=slug.strip(),
            description=description.strip(),
            system_prompt_template=system_prompt_template.strip(),
            model_name=model_name.strip(),
            input_schema=input_schema,
            admin_locked=admin_locked,
            is_active=is_active,
            version=version,
        )
        await self.tool_repo.db.commit()
        await self.tool_repo.db.refresh(tool)
        return ToolRead.model_validate(tool)

    async def delete_tool(self, *, tool_id: UUID) -> None:
        tool = await self.tool_repo.get_tool_by_id(tool_id=tool_id)
        if not tool:
            raise ToolServiceError("Tool not found", status.HTTP_404_NOT_FOUND)
        await self.tool_repo.delete_tool(tool=tool)
        await self.tool_repo.db.commit()

    async def set_tool_active(self, *, tool_id: UUID, is_active: bool) -> ToolRead:
        tool = await self.tool_repo.get_tool_by_id(tool_id=tool_id)
        if not tool:
            raise ToolServiceError("Tool not found", status.HTTP_404_NOT_FOUND)
        tool = await self.tool_repo.set_tool_active(tool=tool, is_active=is_active)
        await self.tool_repo.db.commit()
        await self.tool_repo.db.refresh(tool)
        return ToolRead.model_validate(tool)

    def _render_prompt(self, *, template: str, user_input: str) -> str:
        cleaned_input = user_input.strip()
        # Accept common placeholder variants used in admin-authored templates.
        placeholder_pattern = re.compile(r"\{\{\s*input\s*\}\}|\{input\}", re.IGNORECASE)
        if placeholder_pattern.search(template):
            return placeholder_pattern.sub(cleaned_input, template)
        # Fallback: always include user input even when template is missing a placeholder.
        return f"{template.rstrip()}\n\n{cleaned_input}"

    def _validate_input(self, *, user_input: str, input_schema: dict) -> None:
        expected_type = input_schema.get("type", "string")
        if expected_type != "string":
            raise ToolServiceError("Unsupported input schema type", status.HTTP_400_BAD_REQUEST)

        cleaned = user_input.strip()
        min_length = input_schema.get("min_length")
        if isinstance(min_length, int) and len(cleaned) < min_length:
            raise ToolServiceError(
                f"Input must be at least {min_length} characters",
                status.HTTP_422_UNPROCESSABLE_CONTENT,
            )

        max_length = input_schema.get("max_length")
        if isinstance(max_length, int) and len(cleaned) > max_length:
            raise ToolServiceError(
                f"Input must be at most {max_length} characters",
                status.HTTP_422_UNPROCESSABLE_CONTENT,
            )

        allowed_values = input_schema.get("enum")
        if isinstance(allowed_values, list) and allowed_values and cleaned not in allowed_values:
            raise ToolServiceError(
                "Input must match one of the allowed values",
                status.HTTP_422_UNPROCESSABLE_CONTENT,
            )

        pattern = input_schema.get("pattern")
        if isinstance(pattern, str) and pattern:
            try:
                if not re.fullmatch(pattern, cleaned):
                    raise ToolServiceError(
                        "Input does not match required pattern",
                        status.HTTP_422_UNPROCESSABLE_CONTENT,
                    )
            except re.error as exc:
                raise ToolServiceError("Invalid input schema pattern", status.HTTP_400_BAD_REQUEST) from exc

    def _validate_model_access(self, *, model_name: str, actor_role: str) -> None:
        if not self.model_selector.is_model_allowed_for_role(model_name=model_name, role=actor_role):
            raise ToolServiceError(
                "Selected model is not allowed for your role",
                status.HTTP_403_FORBIDDEN,
            )
