"""add name to users

Revision ID: c0b8e3b1d214
Revises: 7850a65bda5d
Create Date: 2026-03-03 22:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c0b8e3b1d214"
down_revision: Union[str, Sequence[str], None] = "7850a65bda5d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=120), nullable=True))
    op.execute("UPDATE users SET name = username WHERE name IS NULL")
    op.alter_column("users", "name", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "name")
