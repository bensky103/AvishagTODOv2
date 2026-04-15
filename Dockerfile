# ---- Stage 1: Build Next.js static export ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_PUBLIC_BUILD_MODE=export
RUN npm run build

# ---- Stage 2: Final image (nginx + python) ----
FROM python:3.12-slim

# Install nginx
RUN apt-get update && apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

# ---- Python backend ----
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
RUN mkdir -p /data

# ---- Frontend static files ----
COPY --from=frontend-build /app/out /usr/share/nginx/html

# ---- Nginx config ----
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Remove the default nginx site so only our config is used
RUN rm -f /etc/nginx/sites-enabled/default

# ---- Entrypoint: start both nginx and uvicorn ----
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
CMD ["/entrypoint.sh"]
