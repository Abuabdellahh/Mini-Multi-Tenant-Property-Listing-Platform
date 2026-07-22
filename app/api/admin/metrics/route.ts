import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { adminService } from "@/lib/server/services/admin.service"

// GET /api/admin/metrics -> system-wide counts for the Admin dashboard
export const GET = handle(async () => {
  await requireRole("ADMIN")
  const metrics = await adminService.metrics()
  return json(metrics)
})

export const dynamic = "force-dynamic"
