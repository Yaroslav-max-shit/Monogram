FROM python:3.11-slim AS backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
RUN rm -f .env
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]

FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json .
RUN npm ci && npm cache clean --force
COPY frontend/ .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
