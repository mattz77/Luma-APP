# ── Build stage ──────────────────────────────────────────────────────────
FROM oven/bun:1.3.0 AS builder

# Public env vars (baked into JS bundle at build time)
# Pass via --build-arg or BuildKit secret in CI.
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_N8N_WEBHOOK_URL
ARG EXPO_PUBLIC_N8N_HMAC_SECRET
ARG EXPO_PUBLIC_N8N_JWT_SECRET
ARG APP_ENV=production

ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL} \
    EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY} \
    EXPO_PUBLIC_N8N_WEBHOOK_URL=${EXPO_PUBLIC_N8N_WEBHOOK_URL} \
    EXPO_PUBLIC_N8N_HMAC_SECRET=${EXPO_PUBLIC_N8N_HMAC_SECRET} \
    EXPO_PUBLIC_N8N_JWT_SECRET=${EXPO_PUBLIC_N8N_JWT_SECRET} \
    APP_ENV=${APP_ENV}

WORKDIR /app

# Install deps with frozen lockfile (deterministic) + apply patches
COPY luma-app/package.json luma-app/bun.lock ./
COPY luma-app/patches ./patches
RUN bun install --frozen-lockfile

# Copy source + build web bundle
COPY luma-app/ ./
RUN bunx expo export --platform web

# ── Runtime stage ────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Replace default config with SPA-friendly one
COPY infra/proxy/luma-web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy exported static bundle
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck endpoint
RUN echo "ok" > /usr/share/nginx/html/healthz

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
