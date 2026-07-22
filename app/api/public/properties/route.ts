import { handle, json } from "@/lib/server/http"
import { propertyService } from "@/lib/server/services/property.service"
import { listQuerySchema } from "@/lib/validation"

// GET /api/public/properties -> paginated, filterable list of LIVE listings.
// No auth: this is the public marketplace feed.
export const GET = handle(async (req) => {
  const url = new URL(req.url)
  const query = listQuerySchema.parse(Object.fromEntries(url.searchParams))
  const result = await propertyService.listPublic(query)
  return json(result)
})
