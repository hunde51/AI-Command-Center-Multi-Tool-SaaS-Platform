from sqlalchemy.orm import declarative_base


Base = declarative_base()

# Import models after Base is defined so metadata registration does not create
# circular imports during Alembic env loading.
from app import models  # noqa: E402,F401
