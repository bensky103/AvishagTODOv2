#!/bin/sh
set -e

# Run database migrations
cd /app/backend
alembic upgrade head

# Start uvicorn in the background
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start nginx in the foreground
nginx -g "daemon off;"
