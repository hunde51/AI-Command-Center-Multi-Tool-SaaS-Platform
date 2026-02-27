from fastapi import FastAPI
from sqlalchemy import text

from app.db.session import engine

# Create a FastAPI instance
app = FastAPI()


@app.on_event("startup")
async def check_database_connection() -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


# Define a path operation decorator
@app.get("/")
# Define the path operation function
def read_root():
    return {"Hello": "World", "database": "connected"}
