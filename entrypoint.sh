#!/bin/sh
set -e

# Railway provides $PORT; default to 80 for local use
export NGINX_PORT="${PORT:-80}"

# Generate nginx config from template with the correct port
envsubst '${NGINX_PORT}' < /etc/nginx/nginx-site.conf.template > /etc/nginx/sites-enabled/default

cd /app/backend

# Run database migrations
alembic upgrade head

# Start uvicorn in the background
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start nginx in the foreground
nginx -g "daemon off;"
