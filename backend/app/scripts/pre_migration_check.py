"""Detect schema/version drift before running migrations.

Failure mode we're preventing: alembic_version says we're at revision X, but
the actual schema is missing tables or columns that migration X should have
produced. Running `alembic upgrade head` against that state produces cryptic
`no such table` errors partway through a migration, leaving the DB in a worse
state (SQLite can't roll back DDL).

Exits 0 if clean, 2 if drift detected. Stderr carries a human-readable report.
"""
import asyncio
import sys

from alembic.runtime.migration import MigrationContext
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

# Tables we expect to exist once a given revision is applied. Each entry lists
# tables that SHOULD be present at that revision. If current_rev is at or past
# the key, every table in the value list must exist.
_EXPECTED_TABLES_AT_OR_AFTER = {
    "0001": ["suppliers", "tasks", "issue_reports", "action_items"],
    # 0007 drops suppliers and inlines supplier_name, so post-0007 the expected
    # set is different. We handle that below.
}

_TABLES_DROPPED_AT = {
    "0007": ["suppliers"],
}


async def _main() -> int:
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.connect() as conn:
            def _inspect(sync_conn):
                insp = inspect(sync_conn)
                tables = set(insp.get_table_names())
                if "alembic_version" not in tables:
                    return None, tables
                rev = MigrationContext.configure(sync_conn).get_current_revision()
                return rev, tables

            current_rev, tables = await conn.run_sync(_inspect)

            if current_rev is None:
                # Fresh DB or pre-alembic DB — nothing to check. `alembic upgrade
                # head` will create everything from scratch.
                return 0

            expected = set()
            for rev_threshold, required in _EXPECTED_TABLES_AT_OR_AFTER.items():
                if current_rev >= rev_threshold:
                    expected.update(required)
            for rev_threshold, dropped in _TABLES_DROPPED_AT.items():
                if current_rev >= rev_threshold:
                    expected.difference_update(dropped)

            missing = expected - tables
            if missing:
                print(
                    "\n=== SCHEMA/VERSION DRIFT DETECTED ===\n"
                    f"alembic_version says: {current_rev}\n"
                    f"Expected tables at this revision: {sorted(expected)}\n"
                    f"Actually present: {sorted(tables - {'alembic_version'})}\n"
                    f"Missing: {sorted(missing)}\n\n"
                    "DO NOT stamp forward. DO NOT re-run migrations blindly.\n"
                    "A backup (if one exists) is in backend/data/backups/.\n"
                    "Restore from backup, or if this is a dev DB, delete it\n"
                    "and let migrations rebuild from scratch.\n"
                    "====================================\n",
                    file=sys.stderr,
                )
                return 2

            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
