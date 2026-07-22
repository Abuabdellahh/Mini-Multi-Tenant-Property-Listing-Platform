import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { propertyService } from "@/lib/server/services/property.service"
import { createPropertySchema } from "@/lib/validation"

// GET  /api/properties  -> the authenticated OWNER's own listings (all statuses)
export const GET = handle(async () => {
  const owner = await requireRole("OWNER")
  const items = await propertyService.listForOwner(owner.tenantId)
  return json({ items })
})

// POST /api/properties  -> create a DRAFT listing for the authenticated OWNER
export const POST = handle(async (req) => {
  const owner = await requireRole("OWNER")
  const body = await req.json()
  const input = createPropertySchema.parse(body)
  const property = await propertyService.create(owner.tenantId, input)
  return json({ property }, 201)
})
