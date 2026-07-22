import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { propertyService } from "@/lib/server/services/property.service"
import { updatePropertySchema } from "@/lib/validation"

// GET /api/properties/:id -> owner fetches one of their own listings (any status)
export const GET = handle(async (_req, { params }) => {
  const owner = await requireRole("OWNER")
  const { id } = await params
  const property = await propertyService.getForOwner(owner.tenantId, id)
  return json({ property })
})

// PATCH /api/properties/:id -> edit a DRAFT listing (immutable once published)
export const PATCH = handle(async (req, { params }) => {
  const owner = await requireRole("OWNER")
  const { id } = await params
  const body = await req.json()
  const input = updatePropertySchema.parse(body)
  const property = await propertyService.update(owner.tenantId, id, input)
  return json({ property })
})

// DELETE /api/properties/:id -> soft delete (sets deletedAt)
export const DELETE = handle(async (_req, { params }) => {
  const owner = await requireRole("OWNER")
  const { id } = await params
  const result = await propertyService.softDelete(owner.tenantId, id)
  return json(result)
})
