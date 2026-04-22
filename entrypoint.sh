#!/bin/sh
# Safety-wrapped entrypoint for the Railway (single-container) deployment.
# On migration failure we keep the container ALIVE but DO NOT start uvicorn,
# so nginx returns 502 and Docker does not crash-loop on an unrecoverable bug.
set -e

# Railway provides $PORT; default to 80 for local use
NGINX_PORT="${PORT:-80}"

# Generate nginx config from template with the correct port
sed "s/\${NGINX_PORT}/$NGINX_PORT/g" /etc/nginx/nginx-site.conf.template > /etc/nginx/sites-enabled/default

cd /app/backend

# Run safe migration orchestrator. Captures exit code so we can branch on it.
set +e
python -m app.scripts.safe_migrate
MIGRATE_RC=$?
set -e

if [ "$MIGRATE_RC" -eq 0 ]; then
    # Migrations OK — start the app.
    uvicorn app.main:app --host 127.0.0.1 --port 8000 &
else
    # Migrations failed. Do NOT start uvicorn — running the app against a broken
    # schema risks data corruption. Keep the container alive so nginx returns
    # 502 (visible signal to ops), logs are preserved, and `docker exec` still
    # works for investigation. This breaks the crash-restart loop.
    echo "" >&2
    echo "!!! MIGRATION FAILED (exit $MIGRATE_RC). BACKEND NOT STARTED. !!!" >&2
    echo "!!! Container will stay alive for inspection. Investigate logs. !!!" >&2
    echo "" >&2
fi

# Nginx in the foreground keeps the container running whether or not uvicorn
# came up. If uvicorn is down, nginx proxies will return 502 — that's the
# intended degraded-state signal.
nginx -g "daemon off;"
