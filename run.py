"""Avishag Purchase Manager — local development server.

Builds the frontend static export, then serves everything from FastAPI on port 8000.
Same as production (nginx + backend) but in a single process.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

# Load .env
env_file = ROOT / ".env"
env = os.environ.copy()
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip()

# Build frontend static export
print("\n  Building frontend...")
env["NEXT_PUBLIC_BUILD_MODE"] = "export"
subprocess.run("npm run build", cwd=FRONTEND, shell=True, check=True, env=env)
print("  Frontend built.\n")

# Run migrations via the safe orchestrator (backup -> drift check -> upgrade).
# Exits with:
#   0 = success, 2 = drift, 3 = migration failed, 1 = other error.
migrate_rc = subprocess.run(
    [sys.executable, "-m", "app.scripts.safe_migrate"],
    cwd=BACKEND,
    env=env,
).returncode
if migrate_rc != 0:
    print(f"\n  Migration halted (exit {migrate_rc}). Not starting backend.\n")
    sys.exit(migrate_rc)

# Start backend (serves API + static frontend)
print("  App: http://localhost:8000\n")
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=BACKEND,
    env=env,
)

try:
    backend.wait()
except KeyboardInterrupt:
    backend.terminate()
    backend.wait()
