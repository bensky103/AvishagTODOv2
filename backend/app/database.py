import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Ensure data directory exists for SQLite
db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
db_dir = os.path.dirname(db_path)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
