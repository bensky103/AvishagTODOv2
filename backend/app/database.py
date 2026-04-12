import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Ensure data directory exists for SQLite
# Use absolute path resolution relative to the backend directory
db_url = settings.database_url
if ":///./" in db_url:
    # Relative path — resolve relative to this file's parent (backend/)
    rel_path = db_url.split(":///./", 1)[1]
    abs_path = Path(__file__).resolve().parent.parent / rel_path
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    db_url = f"sqlite+aiosqlite:///{abs_path}"
elif db_url.startswith("sqlite"):
    db_path = db_url.replace("sqlite+aiosqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(db_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
