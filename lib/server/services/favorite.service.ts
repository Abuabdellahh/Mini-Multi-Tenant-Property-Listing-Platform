import "server-only"
import { prisma } from "@/lib/server/db"
import { HttpError } from "@/lib/server/http"

// Favorites are scoped to a Regular User. A user can only ever read/write their
// own favorites (userId is derived from the JWT, never the client). Favoriting
// a property that isn't publicly visible is rejected so the list stays coherent.

const publicWhere = { status: "PUBLISHED" as const, disabledByAdmin: false, deletedAt: null }

export const favoriteService = {
  // Returns the full favorited property objects (only ones still live).
  async listForUser(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId, property: publicWhere },
      orderBy: { createdAt: "desc" },
      include: {
        property: { include: { images: { orderBy: { createdAt: "asc" } } } },
      },
    })
    return favorites.map((f) => f.property)
  },

  // Just the ids — used by the client to hydrate the heart-toggle state cheaply.
  async listIdsForUser(userId: string) {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    })
    return rows.map((r) => r.propertyId)
  },

  async add(userId: string, propertyId: string) {
    const property = await prisma.property.findFirst({ where: { id: propertyId, ...publicWhere } })
    if (!property) throw new HttpError(404, "Property not found or not available")
    await prisma.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    })
    return { propertyId, favorited: true }
  },

  async remove(userId: string, propertyId: string) {
    await prisma.favorite.deleteMany({ where: { userId, propertyId } })
    return { propertyId, favorited: false }
  },
}
