"""add per-tool model config and provider credentials

Revision ID: f2a9c3d1e6b7
Revises: e4f1a2b3c4d5
Create Date: 2026-03-06 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a9c3d1e6b7"
down_revision: Union[str, Sequence[str], None] = "e4f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    tool_columns = {col["name"] for col in inspector.get_columns("tools")}
    if "model_name" not in tool_columns:
        op.add_column(
            "tools",
            sa.Column("model_name", sa.String(length=120), nullable=False, server_default="gemini-2.5-flash"),
        )
    if "admin_locked" not in tool_columns:
        op.add_column(
            "tools",
            sa.Column("admin_locked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )
    if "created_by_user_id" not in tool_columns:
        op.add_column("tools", sa.Column("created_by_user_id", sa.UUID(), nullable=True))
        op.create_foreign_key(
            "fk_tools_created_by_user_id_users",
            "tools",
            "users",
            ["created_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )

    tool_indexes = {idx["name"] for idx in inspector.get_indexes("tools")}
    if "ix_tools_created_by_user_id" not in tool_indexes:
        op.create_index("ix_tools_created_by_user_id", "tools", ["created_by_user_id"], unique=False)

    if not inspector.has_table("provider_credentials"):
        op.create_table(
            "provider_credentials",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("provider", sa.String(length=30), nullable=False),
            sa.Column("encrypted_api_key", sa.Text(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("rotated_by_admin_id", sa.UUID(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["rotated_by_admin_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("provider"),
        )
    provider_indexes = {idx["name"] for idx in inspector.get_indexes("provider_credentials")}
    if "ix_provider_credentials_provider" not in provider_indexes:
        op.create_index("ix_provider_credentials_provider", "provider_credentials", ["provider"], unique=False)
    if "ix_provider_credentials_is_active" not in provider_indexes:
        op.create_index("ix_provider_credentials_is_active", "provider_credentials", ["is_active"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("provider_credentials"):
        provider_indexes = {idx["name"] for idx in inspector.get_indexes("provider_credentials")}
        if "ix_provider_credentials_is_active" in provider_indexes:
            op.drop_index("ix_provider_credentials_is_active", table_name="provider_credentials")
        if "ix_provider_credentials_provider" in provider_indexes:
            op.drop_index("ix_provider_credentials_provider", table_name="provider_credentials")
        op.drop_table("provider_credentials")

    tool_columns = {col["name"] for col in inspector.get_columns("tools")}
    tool_indexes = {idx["name"] for idx in inspector.get_indexes("tools")}
    fk_names = {fk["name"] for fk in inspector.get_foreign_keys("tools")}
    if "ix_tools_created_by_user_id" in tool_indexes:
        op.drop_index("ix_tools_created_by_user_id", table_name="tools")
    if "fk_tools_created_by_user_id_users" in fk_names:
        op.drop_constraint("fk_tools_created_by_user_id_users", "tools", type_="foreignkey")
    if "created_by_user_id" in tool_columns:
        op.drop_column("tools", "created_by_user_id")
    if "admin_locked" in tool_columns:
        op.drop_column("tools", "admin_locked")
    if "model_name" in tool_columns:
        op.drop_column("tools", "model_name")
