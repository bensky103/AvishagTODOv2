"""Pre-migration backup. Idempotent. No-op when DB is at head or has no schema."""
import asyncio
import sys
from datetime import datetime
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

_BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "backups"


async def _main() -> int:
    cfg = Config("alembic.ini")
    script = ScriptDirectory.from_config(cfg)
    target_rev = script.get_current_head()

    engine = create_async_engine(settings.database_url)
    try:
        async with engine.connect() as conn:
            def _has_alembic_table(sync_conn):
                return "alembic_version" in inspect(sync_conn).get_table_names()

            if not await conn.run_sync(_has_alembic_table):
                # Fresh DB — no prior state to preserve.
                return 0

            def _current(sync_conn):
                return MigrationContext.configure(sync_conn).get_current_revision()

            current_rev = await conn.run_sync(_current)

            if current_rev is None or current_rev == target_rev:
                return 0

            _BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            # Timestamp so every attempt keeps its own snapshot — never silently
            # reuse a stale backup from a previous failed run.
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            backup_path = _BACKUP_DIR / f"pre-{current_rev}-to-{target_rev}-{stamp}.db"

            await conn.execute(text(f"VACUUM INTO '{backup_path}'"))
            print(f"pre-migration backup created: {backup_path}", file=sys.stderr)
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
