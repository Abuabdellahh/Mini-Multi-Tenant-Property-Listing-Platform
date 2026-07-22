#!/bin/sh
set -e

# Optional one-time DB setup against Neon, controlled by env flags so normal
# restarts don't touch the schema. Uses DATABASE_URL_UNPOOLED (direct connection)
# via the schema's `directUrl`, which is what Prisma needs for db push.

# Binaries (prisma, tsx, next) resolve from /app/node_modules/.bin via PATH.
# We call them directly rather than through pnpm, which at runtime would try an
# auto dependency-install into the root-owned /app and fail.

if [ "${RUN_DB_PUSH}" = "true" ]; then
  echo "==> Syncing Prisma schema to the database (prisma db push)..."
  prisma db push --skip-generate
fi

if [ "${RUN_SEED}" = "true" ]; then
  echo "==> Seeding database (admin / owner / user)..."
  prisma db seed
fi

echo "==> Starting: $*"
exec "$@"
