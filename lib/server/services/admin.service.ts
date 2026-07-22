import "server-only"
import { prisma } from "@/lib/server/db"
import { HttpError } from "@/lib/server/http"
import type { Prisma } from "@prisma/client"
import type { ListQuery } from "@/lib/validation"

// Admin is cross-tenant: unlike the owner service, these queries are NOT scoped
// by tenantId. This is the single place where that cross-tenant power lives.

const withImagesAndOwner = {
  images: { orderBy: { createdAt: "asc" as const } },
  owner: { select: { id: true, email: true, name: true } },
}

export const adminService = {
  // Every non-deleted property, any status, any tenant, with optional filters.
  async listAll(query: ListQuery) {
    const where: Prisma.PropertyWhereInput = { deletedAt: null }
    if (query.status) where.status = query.status
    if (query.location) where.location = { contains: query.location, mode: "insensitive" }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.price = {}
      if (query.priceMin !== undefined) (where.price as Prisma.IntFilter).gte = query.priceMin
      if (query.priceMax !== undefined) (where.price as Prisma.IntFilter).lte = query.priceMax
    }

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: withImagesAndOwner,
      }),
    ])

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  // Disable ≠ delete: flips disabledByAdmin, hiding it from public listings but
  // keeping it visible (flagged) in the owner's dashboard.
  async setDisabled(id: string, disabled: boolean) {
    const property = await prisma.property.findFirst({ where: { id, deletedAt: null } })
    if (!property) throw new HttpError(404, "Property not found")
    return prisma.property.update({
      where: { id },
      data: { disabledByAdmin: disabled },
      include: withImagesAndOwner,
    })
  },

  async metrics() {
    const [totalUsers, usersByRole, totalProperties, propsByStatus, disabledCount, favoritesCount] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: true }),
        prisma.property.count({ where: { deletedAt: null } }),
        prisma.property.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
        prisma.property.count({ where: { deletedAt: null, disabledByAdmin: true } }),
        prisma.favorite.count(),
      ])

    const statusMap = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 } as Record<string, number>
    for (const row of propsByStatus) statusMap[row.status] = row._count
    const roleMap = { ADMIN: 0, OWNER: 0, USER: 0 } as Record<string, number>
    for (const row of usersByRole) roleMap[row.role] = row._count

    return {
      totalUsers,
      usersByRole: roleMap,
      totalProperties,
      propertiesByStatus: statusMap,
      disabledByAdmin: disabledCount,
      totalFavorites: favoritesCount,
    }
  },
}
