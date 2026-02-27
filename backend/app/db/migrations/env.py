import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------
# FIX PYTHON PATH (because migrations folder is deep inside app/db/)
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[3]
sys.path.append(str(BASE_DIR))

# ---------------------------------------------------------
# IMPORT YOUR METADATA
# ---------------------------------------------------------
from app.db.base import Base
from app.models import *  # make sure all models are imported
from app.core.config import settings

# Alembic Config
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# VERY IMPORTANT
target_metadata = Base.metadata


# ---------------------------------------------------------
# OFFLINE MODE
# ---------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# ONLINE MODE (ASYNC)
# ---------------------------------------------------------
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in online mode with async engine."""

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# ---------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
