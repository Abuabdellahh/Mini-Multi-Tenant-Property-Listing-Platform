# syntax=docker/dockerfile:1

# ---- Base -------------------------------------------------------------------
# Debian slim (not Alpine) so Prisma's default "native" query engine works
# without extra musl binary targets. openssl is required by the engine.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1
# Pin pnpm 9 to match the v9 lockfile (corepack's default pnpm 10 is stricter
# about ignored build scripts and the overrides hash).
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate && \
    apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies -----------------------------------------------------------
# Install with the lockfile only, so this layer caches until deps change.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# --no-frozen-lockfile because the lockfile's overrides hash was written by a
# different pnpm minor; the resolved deps are identical so nothing actually changes.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile

# ---- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client, then build Next. The app's only static page is a
# placeholder, so the build never touches the database.
RUN pnpm prisma generate && pnpm build

# ---- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PATH="/app/node_modules/.bin:$PATH"
# Full node_modules is kept so `prisma db push` and the tsx seed script can run
# from inside the container (see docker-entrypoint.sh).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as the built-in unprivileged node user.
USER node

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["next", "start"]
