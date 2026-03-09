"""auth hardening fields

Revision ID: d7a1b2c3e4f5
Revises: a5e1d9c2b7f4
Create Date: 2026-03-09 22:50:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d7a1b2c3e4f5"
down_revision: Union[str, Sequence[str], None] = "a5e1d9c2b7f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("lock_until", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("users", "is_email_verified", server_default=sa.text("false"))


def downgrade() -> None:
    op.drop_column("users", "lock_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "is_email_verified")
