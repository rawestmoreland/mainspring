# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_POCKETBASE_URL=http://localhost:8080
ARG VITE_ASSET_URL=http://localhost:8080/api/files/watch_photos
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
ENV VITE_ASSET_URL=$VITE_ASSET_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
