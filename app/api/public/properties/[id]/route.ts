import { handle, json } from "@/lib/server/http"
import { propertyService } from "@/lib/server/services/property.service"

// GET /api/public/properties/:id -> a single LIVE listing (public detail)
export const GET = handle(async (_req, { params }) => {
  const { id } = await params
  const property = await propertyService.getPublic(id)
  return json({ property })
})
