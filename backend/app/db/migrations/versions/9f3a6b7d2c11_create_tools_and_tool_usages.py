"""create tools and tool_usages tables

Revision ID: 9f3a6b7d2c11
Revises: c0b8e3b1d214
Create Date: 2026-03-04 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f3a6b7d2c11"
down_revision: Union[str, Sequence[str], None] = "c0b8e3b1d214"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("tools"):
        op.create_table(
            "tools",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=False),
            sa.Column("system_prompt_template", sa.Text(), nullable=False),
            sa.Column("input_schema", sa.JSON(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
            sa.UniqueConstraint("slug"),
        )

    existing_tool_indexes = {idx["name"] for idx in inspector.get_indexes("tools")}
    if "ix_tools_slug" not in existing_tool_indexes:
        op.create_index("ix_tools_slug", "tools", ["slug"], unique=False)

    if not inspector.has_table("tool_usages"):
        op.create_table(
            "tool_usages",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("tool_id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("tokens_used", sa.Integer(), nullable=False),
            sa.Column("cost_estimate", sa.Float(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_usage_indexes = {idx["name"] for idx in inspector.get_indexes("tool_usages")}
    if "ix_tool_usages_user_id" not in existing_usage_indexes:
        op.create_index("ix_tool_usages_user_id", "tool_usages", ["user_id"], unique=False)
    if "ix_tool_usages_tool_id" not in existing_usage_indexes:
        op.create_index("ix_tool_usages_tool_id", "tool_usages", ["tool_id"], unique=False)
    if "ix_tool_usages_user_id_tool_id" not in existing_usage_indexes:
        op.create_index("ix_tool_usages_user_id_tool_id", "tool_usages", ["user_id", "tool_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("tool_usages"):
        existing_usage_indexes = {idx["name"] for idx in inspector.get_indexes("tool_usages")}
        if "ix_tool_usages_user_id_tool_id" in existing_usage_indexes:
            op.drop_index("ix_tool_usages_user_id_tool_id", table_name="tool_usages")
        if "ix_tool_usages_tool_id" in existing_usage_indexes:
            op.drop_index("ix_tool_usages_tool_id", table_name="tool_usages")
        if "ix_tool_usages_user_id" in existing_usage_indexes:
            op.drop_index("ix_tool_usages_user_id", table_name="tool_usages")
        op.drop_table("tool_usages")

    if inspector.has_table("tools"):
        existing_tool_indexes = {idx["name"] for idx in inspector.get_indexes("tools")}
        if "ix_tools_slug" in existing_tool_indexes:
            op.drop_index("ix_tools_slug", table_name="tools")
        op.drop_table("tools")
