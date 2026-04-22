"""Weekly SQLite backup via VACUUM INTO, with rotation."""
import glob
import os
from datetime import date
from pathlib import Path

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger("backup_service")

# Resolve to <repo>/backend/data/backups/ (parents: services → app → backend)
_BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "backups"
_WEEKS_TO_KEEP = 4
_WEEKLY_FILENAME_FMT = "avishag-%Y-%m-%d.db"


async def run_weekly_backup(session: AsyncSession) -> Path:
    """Take a VACUUM INTO backup named by today's date; rotate old weeklies.

    Returns the path to the backup file (whether new or pre-existing today).
    """
    _BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    target = _BACKUP_DIR / date.today().strftime(_WEEKLY_FILENAME_FMT)
    if target.exists():
        logger.info("weekly_backup_skipped_exists", path=str(target))
        return target
    # Path is internal-only (constants + strftime); no injection surface.
    await session.execute(text(f"VACUUM INTO '{target}'"))
    logger.info("weekly_backup_created", path=str(target), size=target.stat().st_size)
    _rotate_weeklies()
    return target


def _rotate_weeklies() -> None:
    """Keep only the most recent _WEEKS_TO_KEEP weekly backups; delete older."""
    files = sorted(glob.glob(str(_BACKUP_DIR / "avishag-*.db")), reverse=True)
    for old in files[_WEEKS_TO_KEEP:]:
        try:
            os.remove(old)
            logger.info("rotated_old_backup", path=old)
        except OSError as e:
            logger.warning("rotation_failed", path=old, error=str(e))
