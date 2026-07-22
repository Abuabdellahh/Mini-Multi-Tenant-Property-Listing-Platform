import "server-only"
import { prisma } from "@/lib/server/db"
import { HttpError } from "@/lib/server/http"
import type { CreatePropertyInput, UpdatePropertyInput, ListQuery } from "@/lib/validation"
import type { Prisma } from "@prisma/client"

// Property module service. All owner-facing methods REQUIRE a tenantId and scope
// every query by it, so one owner can never read or mutate another owner's rows
// (tenant isolation). tenantId is always derived from the JWT, never the client.

const withImages = { images: { orderBy: { createdAt: "asc" as const } } }

export const propertyService = {
  // ---- Owner-scoped reads ----
  async listForOwner(tenantId: string) {
    return prisma.property.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: withImages,
    })
  },

  async getForOwner(tenantId: string, id: string) {
    const property = await prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: withImages,
    })
    if (!property) throw new HttpError(404, "Property not found")
    return property
  },

  // ---- Create ----
  async create(tenantId: string, input: CreatePropertyInput) {
    return prisma.property.create({
      data: {
        tenantId,
        title: input.title,
        description: input.description,
        location: input.location,
        price: input.price,
        status: "DRAFT",
        images: {
          create: (input.images ?? []).map((img) => ({
            url: img.url,
            mimeType: img.mimeType,
            sizeBytes: img.sizeBytes ?? 0,
          })),
        },
      },
      include: withImages,
    })
  },

  // ---- Update (only allowed while DRAFT) ----
  async update(tenantId: string, id: string, input: UpdatePropertyInput) {
    const existing = await this.getForOwner(tenantId, id)
    if (existing.status !== "DRAFT") {
      throw new HttpError(409, "Only draft properties can be edited. Published listings are immutable.")
    }

    const data: Prisma.PropertyUpdateInput = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.location !== undefined) data.location = input.location
    if (input.price !== undefined) data.price = input.price

    // If images provided, replace the full set transactionally.
    if (input.images !== undefined) {
      return prisma.$transaction(async (tx) => {
        await tx.propertyImage.deleteMany({ where: { propertyId: id } })
        await tx.property.update({
          where: { id },
          data: {
            ...data,
            images: {
              create: input.images!.map((img) => ({
                url: img.url,
                mimeType: img.mimeType,
                sizeBytes: img.sizeBytes ?? 0,
              })),
            },
          },
        })
        return tx.property.findFirstOrThrow({ where: { id }, include: withImages })
      })
    }

    return prisma.property.update({ where: { id }, data, include: withImages })
  },

  // ---- Publish (transactional, with validation) ----
  async publish(tenantId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { images: true },
      })
      if (!property) throw new HttpError(404, "Property not found")
      if (property.status === "PUBLISHED") {
        throw new HttpError(409, "Property is already published")
      }
      if (property.status === "ARCHIVED") {
        throw new HttpError(409, "Archived properties cannot be published")
      }

      // Business rules required before a listing can go live.
      const problems: string[] = []
      if (property.title.trim().length < 3) problems.push("a title of at least 3 characters")
      if (property.description.trim().length < 10) problems.push("a description of at least 10 characters")
      if (!property.location.trim()) problems.push("a location")
      if (property.price <= 0) problems.push("a price greater than 0")
      if (property.images.length < 1) problems.push("at least one image")
      if (problems.length > 0) {
        throw new HttpError(422, `Cannot publish: this listing needs ${problems.join(", ")}.`)
      }

      return tx.property.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
        include: withImages,
      })
    })
  },

  // ---- Archive / unpublish (owner) ----
  async archive(tenantId: string, id: string) {
    const existing = await this.getForOwner(tenantId, id)
    if (existing.status !== "PUBLISHED") {
      throw new HttpError(409, "Only published properties can be archived")
    }
    return prisma.property.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: withImages,
    })
  },

  // ---- Soft delete ----
  async softDelete(tenantId: string, id: string) {
    await this.getForOwner(tenantId, id)
    await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } })
    return { id, deleted: true }
  },

  // ---- Public reads (only live listings) ----
  async listPublic(query: ListQuery) {
    const where: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      disabledByAdmin: false,
      deletedAt: null,
    }
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
        orderBy: { publishedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: withImages,
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

  async getPublic(id: string) {
    const property = await prisma.property.findFirst({
      where: { id, status: "PUBLISHED", disabledByAdmin: false, deletedAt: null },
      include: withImages,
    })
    if (!property) throw new HttpError(404, "Property not found")
    return property
  },
}
