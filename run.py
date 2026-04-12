"""Avishag Purchase Manager — start backend + frontend."""

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

# Run migrations
subprocess.run("alembic upgrade head", cwd=BACKEND, shell=True, check=True, env=env)

# Start backend (port 8000)
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=BACKEND,
    env=env,
)

# Start frontend (port 3000)
frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=FRONTEND,
    env=env,
    shell=True,
)

print("\n  Backend:  http://localhost:8000")
print("  Frontend: http://localhost:3000  <-- open this one\n")

try:
    backend.wait()
except KeyboardInterrupt:
    backend.terminate()
    frontend.terminate()
    backend.wait()
    frontend.wait()
