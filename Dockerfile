# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend static export
COPY --from=frontend-build /app/frontend/out ./frontend/out

# Create data directory for SQLite
RUN mkdir -p /data

# Copy startup script
COPY backend/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8000

CMD ["./start.sh"]
