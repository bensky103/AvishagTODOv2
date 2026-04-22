"""One-time pre-migration backup. Idempotent. Safe no-op when DB is at head."""
import asyncio
import sys
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import text
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
            def _current(sync_conn):
                return MigrationContext.configure(sync_conn).get_current_revision()

            try:
                current_rev = await conn.run_sync(_current)
            except Exception:
                # No alembic_version table yet — fresh DB, nothing to back up.
                return 0

            if current_rev is None:
                # Fresh DB with no applied revisions; nothing to back up.
                return 0

            if current_rev == target_rev:
                # Already at head, nothing pending.
                return 0

            _BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            backup_path = _BACKUP_DIR / f"pre-{current_rev}-to-{target_rev}.db"
            if backup_path.exists():
                print(
                    f"pre-migration backup already exists: {backup_path}",
                    file=sys.stderr,
                )
                return 0

            await conn.execute(text(f"VACUUM INTO '{backup_path}'"))
            print(f"pre-migration backup created: {backup_path}", file=sys.stderr)
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
