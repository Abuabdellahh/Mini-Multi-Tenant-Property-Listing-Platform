import { handle, json } from "@/lib/server/http"
import { requireRole } from "@/lib/server/guards"
import { favoriteService } from "@/lib/server/services/favorite.service"

// GET /api/favorites -> the authenticated USER's favorited properties + ids
export const GET = handle(async () => {
  const user = await requireRole("USER")
  const [items, ids] = await Promise.all([
    favoriteService.listForUser(user.id),
    favoriteService.listIdsForUser(user.id),
  ])
  return json({ items, ids })
})

export const dynamic = "force-dynamic"
