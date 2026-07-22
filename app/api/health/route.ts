import { prisma } from "@/lib/server/db"
import { handle, json } from "@/lib/server/http"

// GET /api/health — liveness + DB connectivity check.
export const GET = handle(async () => {
  await prisma.$queryRaw`SELECT 1`
  return json({
    status: "ok",
    service: "property-platform-api",
    db: "connected",
    time: new Date().toISOString(),
  })
})

export const dynamic = "force-dynamic"
