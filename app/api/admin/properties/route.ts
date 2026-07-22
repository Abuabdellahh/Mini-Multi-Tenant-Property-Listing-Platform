import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { adminService } from "@/lib/server/services/admin.service"
import { listQuerySchema } from "@/lib/validation"

// GET /api/admin/properties -> cross-tenant list of all properties (any status)
export const GET = handle(async (req) => {
  await requireRole("ADMIN")
  const url = new URL(req.url)
  const query = listQuerySchema.parse(Object.fromEntries(url.searchParams))
  const result = await adminService.listAll(query)
  return json(result)
})

export const dynamic = "force-dynamic"
