"""Tests for backup_service.run_weekly_backup and _rotate_weeklies."""
import sqlite3
from pathlib import Path

import pytest

from app.services import backup_service


@pytest.mark.asyncio
async def test_backup_creates_file(session, tmp_path, monkeypatch):
    """run_weekly_backup creates today's backup file as a valid SQLite DB."""
    backup_dir = tmp_path / "backups"
    monkeypatch.setattr(backup_service, "_BACKUP_DIR", backup_dir)

    path = await backup_service.run_weekly_backup(session)

    assert path.exists()
    assert path.stat().st_size > 0
    # Must be a valid SQLite database
    con = sqlite3.connect(str(path))
    try:
        # sqlite_master query works on any valid SQLite database
        cur = con.execute("SELECT name FROM sqlite_master")
        cur.fetchall()
    finally:
        con.close()


@pytest.mark.asyncio
async def test_backup_idempotent_same_day(session, tmp_path, monkeypatch):
    """Calling run_weekly_backup twice in the same day leaves exactly one file."""
    backup_dir = tmp_path / "backups"
    monkeypatch.setattr(backup_service, "_BACKUP_DIR", backup_dir)

    first = await backup_weekly_with_fresh_session(session, backup_service)
    second = await backup_service.run_weekly_backup(session)

    assert first == second
    files = list(backup_dir.glob("avishag-*.db"))
    assert len(files) == 1


async def backup_weekly_with_fresh_session(session, svc):
    """Helper — just a thin wrapper so first/second calls look symmetric."""
    return await svc.run_weekly_backup(session)


def test_rotation_keeps_last_4(tmp_path, monkeypatch):
    """_rotate_weeklies keeps only the 4 most recent dated files."""
    backup_dir = tmp_path / "backups"
    backup_dir.mkdir()
    monkeypatch.setattr(backup_service, "_BACKUP_DIR", backup_dir)

    # Pre-create 6 dated files. Lexicographic order == date order for YYYY-MM-DD.
    dates = [
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
        "2026-01-06",
    ]
    for d in dates:
        (backup_dir / f"avishag-{d}.db").write_bytes(b"")

    backup_service._rotate_weeklies()

    remaining = sorted(p.name for p in backup_dir.glob("avishag-*.db"))
    assert remaining == [
        "avishag-2026-01-03.db",
        "avishag-2026-01-04.db",
        "avishag-2026-01-05.db",
        "avishag-2026-01-06.db",
    ]


@pytest.mark.asyncio
async def test_backup_dir_created_if_missing(session, tmp_path, monkeypatch):
    """run_weekly_backup creates _BACKUP_DIR if it does not yet exist."""
    backup_dir = tmp_path / "nested" / "backups"
    monkeypatch.setattr(backup_service, "_BACKUP_DIR", backup_dir)

    assert not backup_dir.exists()
    await backup_service.run_weekly_backup(session)
    assert backup_dir.is_dir()
