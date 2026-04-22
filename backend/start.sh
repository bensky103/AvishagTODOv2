#!/bin/bash
# Safety-wrapped entrypoint for the docker-compose (backend-only container) path.
# Shares the same safe-migrate orchestrator as the Railway entrypoint.
# On migration failure we stay alive without uvicorn to break the crash-loop.
set -e

cd /app/backend

set +e
python -m app.scripts.safe_migrate
MIGRATE_RC=$?
set -e

if [ "$MIGRATE_RC" -eq 0 ]; then
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi

echo "" >&2
echo "!!! MIGRATION FAILED (exit $MIGRATE_RC). BACKEND NOT STARTED. !!!" >&2
echo "!!! Container will stay alive for inspection. Investigate logs. !!!" >&2
echo "" >&2

# Hold the container open so ops can `docker exec` in to diagnose. We do not
# exit non-zero here because that would trigger `restart: unless-stopped` and
# produce exactly the crash-loop this script is designed to prevent.
exec sleep infinity
