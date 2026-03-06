"""phase 4 admin system

Revision ID: e4f1a2b3c4d5
Revises: b1c2d3e4f5a6
Create Date: 2026-03-06 10:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    users_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_deleted" not in users_columns:
        op.add_column("users", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")))
        op.alter_column("users", "is_deleted", server_default=None)

    user_indexes = {idx["name"] for idx in inspector.get_indexes("users")}
    if "ix_users_is_deleted" not in user_indexes:
        op.create_index("ix_users_is_deleted", "users", ["is_deleted"], unique=False)
    if "ix_users_created_at" not in user_indexes:
        op.create_index("ix_users_created_at", "users", ["created_at"], unique=False)

    if not inspector.has_table("admin_logs"):
        op.create_table(
            "admin_logs",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("admin_id", sa.UUID(), nullable=False),
            sa.Column("action", sa.String(length=120), nullable=False),
            sa.Column("target_user_id", sa.UUID(), nullable=True),
            sa.Column("metadata", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["admin_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )

    admin_log_indexes = {idx["name"] for idx in inspector.get_indexes("admin_logs")}
    if "ix_admin_logs_admin_id" not in admin_log_indexes:
        op.create_index("ix_admin_logs_admin_id", "admin_logs", ["admin_id"], unique=False)
    if "ix_admin_logs_target_user_id" not in admin_log_indexes:
        op.create_index("ix_admin_logs_target_user_id", "admin_logs", ["target_user_id"], unique=False)
    if "ix_admin_logs_created_at" not in admin_log_indexes:
        op.create_index("ix_admin_logs_created_at", "admin_logs", ["created_at"], unique=False)
    if "ix_admin_logs_action" not in admin_log_indexes:
        op.create_index("ix_admin_logs_action", "admin_logs", ["action"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("admin_logs"):
        indexes = {idx["name"] for idx in inspector.get_indexes("admin_logs")}
        if "ix_admin_logs_action" in indexes:
            op.drop_index("ix_admin_logs_action", table_name="admin_logs")
        if "ix_admin_logs_created_at" in indexes:
            op.drop_index("ix_admin_logs_created_at", table_name="admin_logs")
        if "ix_admin_logs_target_user_id" in indexes:
            op.drop_index("ix_admin_logs_target_user_id", table_name="admin_logs")
        if "ix_admin_logs_admin_id" in indexes:
            op.drop_index("ix_admin_logs_admin_id", table_name="admin_logs")
        op.drop_table("admin_logs")

    user_indexes = {idx["name"] for idx in inspector.get_indexes("users")}
    if "ix_users_is_deleted" in user_indexes:
        op.drop_index("ix_users_is_deleted", table_name="users")
    if "ix_users_created_at" in user_indexes:
        op.drop_index("ix_users_created_at", table_name="users")

    users_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_deleted" in users_columns:
        op.drop_column("users", "is_deleted")
