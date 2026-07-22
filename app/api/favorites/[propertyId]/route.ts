import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { favoriteService } from "@/lib/server/services/favorite.service"

// POST /api/favorites/:propertyId -> add to favorites
export const POST = handle(async (_req, { params }) => {
  const user = await requireRole("USER")
  const { propertyId } = await params
  const result = await favoriteService.add(user.id, propertyId)
  return json(result, 201)
})

// DELETE /api/favorites/:propertyId -> remove from favorites
export const DELETE = handle(async (_req, { params }) => {
  const user = await requireRole("USER")
  const { propertyId } = await params
  const result = await favoriteService.remove(user.id, propertyId)
  return json(result)
})
