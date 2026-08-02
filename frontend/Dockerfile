# syntax=docker/dockerfile:1

# --- Dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Builder: produce the static export (out/) ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* values are inlined at build time, so this must be a build arg.
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runtime: serve the static export ---
# In production the exported site is hosted on S3 + CloudFront. This image
# exists only so the local `docker compose` stack keeps working: it serves the
# static `out/` on :3000 (with SPA fallback) behind the same Caddy proxy.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g serve@14

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/out ./out

USER nextjs
EXPOSE 3000

CMD ["serve", "-s", "out", "-l", "3000"]
