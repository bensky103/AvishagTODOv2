FROM python:3.12-slim
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

RUN mkdir -p /data && chmod +x /app/backend/start.sh

EXPOSE 8000
CMD ["/app/backend/start.sh"]
