"""Safe migration orchestrator. Runs backup -> drift check -> alembic upgrade.

Exit codes:
  0  success (migrations up to date or applied cleanly)
  2  schema/version drift detected; operator intervention required
  3  migration itself failed; operator intervention required
  1  unexpected internal error (e.g. backup failed, cannot reach DB)

Shell entrypoints branch on these codes: 0 continues to uvicorn, anything else
keeps the container alive in degraded state without starting the app.
"""
import subprocess
import sys


def _run(module: str) -> int:
    result = subprocess.run([sys.executable, "-m", module])
    return result.returncode


def main() -> int:
    rc = _run("app.scripts.pre_migration_backup")
    if rc != 0:
        print(f"\nFATAL: pre-migration backup failed (exit {rc}).", file=sys.stderr)
        print("Refusing to run migrations without a backup.", file=sys.stderr)
        return 1

    rc = _run("app.scripts.pre_migration_check")
    if rc == 2:
        # Drift message already printed to stderr by the check script.
        return 2
    if rc != 0:
        print(f"\nFATAL: pre-migration check failed (exit {rc}).", file=sys.stderr)
        return 1

    rc = subprocess.run(["alembic", "upgrade", "head"]).returncode
    if rc != 0:
        print(
            "\n=== MIGRATION FAILED ===\n"
            f"`alembic upgrade head` exited with status {rc}.\n"
            "A backup was taken before this attempt; see backend/data/backups/.\n"
            "Fix the migration or restore from backup before restarting.\n"
            "========================\n",
            file=sys.stderr,
        )
        return 3

    return 0


if __name__ == "__main__":
    sys.exit(main())
