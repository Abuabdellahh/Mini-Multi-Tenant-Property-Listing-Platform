import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { propertyService } from "@/lib/server/services/property.service"

// POST /api/properties/:id/publish -> transactional publish with validation
export const POST = handle(async (_req, { params }) => {
  const owner = await requireRole("OWNER")
  const { id } = await params
  const property = await propertyService.publish(owner.tenantId, id)
  return json({ property })
})
