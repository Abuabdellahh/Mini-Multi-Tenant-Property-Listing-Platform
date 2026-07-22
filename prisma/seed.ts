import { PrismaClient, type Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const PASSWORD = process.env.SEED_PASSWORD ?? "Password123!"

async function upsertUser(email: string, role: "ADMIN" | "OWNER" | "USER", name: string) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: { role, name, passwordHash, deletedAt: null, tenantId: existing.tenantId },
    })
  }
  const created = await prisma.user.create({
    data: { email, role, name, passwordHash, tenantId: "pending" },
  })
  return prisma.user.update({ where: { id: created.id }, data: { tenantId: created.id } })
}

async function main() {
  console.log("Seeding database...")

  const admin = await upsertUser("admin@example.com", "ADMIN", "Ava Admin")
  const owner1 = await upsertUser("owner@example.com", "OWNER", "Olive Owner")
  const owner2 = await upsertUser("owner2@example.com", "OWNER", "Owen Owner")
  const user = await upsertUser("user@example.com", "USER", "Uma User")

  // Reset demo properties so re-seeding is deterministic.
  await prisma.propertyImage.deleteMany({})
  await prisma.favorite.deleteMany({})
  await prisma.property.deleteMany({})

  const demo: Array<{
    ownerId: string
    title: string
    description: string
    location: string
    price: number
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    images: string[]
  }> = [
    {
      ownerId: owner1.id,
      title: "Sunlit Loft in the Arts District",
      description:
        "A bright, open-plan loft with floor-to-ceiling windows, exposed brick, and a private rooftop terrace overlooking the city skyline.",
      location: "Los Angeles, CA",
      price: 4200,
      status: "PUBLISHED",
      images: ["/modern-loft-living-room.png", "/loft-rooftop-terrace-city-view.png"],
    },
    {
      ownerId: owner1.id,
      title: "Coastal Cottage with Ocean Views",
      description:
        "Charming two-bedroom cottage steps from the beach. Wraparound porch, updated kitchen, and unobstructed sunset views.",
      location: "Santa Barbara, CA",
      price: 3800,
      status: "PUBLISHED",
      images: ["/coastal-cottage-exterior-ocean.png"],
    },
    {
      ownerId: owner1.id,
      title: "Downtown Studio (Draft)",
      description: "Compact, efficient studio near transit. Currently being prepared for listing.",
      location: "Los Angeles, CA",
      price: 1900,
      status: "DRAFT",
      images: [],
    },
    {
      ownerId: owner2.id,
      title: "Modern Hillside Villa",
      description:
        "Architect-designed villa with an infinity pool, four ensuite bedrooms, and panoramic canyon views. Fully furnished.",
      location: "Austin, TX",
      price: 9500,
      status: "PUBLISHED",
      images: ["/modern-hillside-villa-pool.png"],
    },
    {
      ownerId: owner2.id,
      title: "Cozy Garden Apartment",
      description:
        "Ground-floor one-bedroom with a private garden, in-unit laundry, and a quiet tree-lined street.",
      location: "Portland, OR",
      price: 2100,
      status: "PUBLISHED",
      images: ["/garden-apartment-patio.png"],
    },
  ]

  for (const p of demo) {
    const created = await prisma.property.create({
      data: {
        tenantId: p.ownerId,
        title: p.title,
        description: p.description,
        location: p.location,
        price: p.price,
        status: p.status,
        publishedAt: p.status === "PUBLISHED" ? new Date() : null,
        images: {
          create: p.images.map<Prisma.PropertyImageCreateWithoutPropertyInput>((url) => ({
            url,
            mimeType: url.endsWith(".png") ? "image/png" : "image/jpeg",
            sizeBytes: 500_000,
          })),
        },
      },
    })
    // Give the regular user a favorite so their dashboard isn't empty.
    if (p.status === "PUBLISHED" && p.ownerId === owner1.id) {
      await prisma.favorite.upsert({
        where: { userId_propertyId: { userId: user.id, propertyId: created.id } },
        create: { userId: user.id, propertyId: created.id },
        update: {},
      })
    }
  }

  console.log("Seed complete.")
  console.log("Test credentials (password for all):", PASSWORD)
  console.table([
    { role: "ADMIN", email: admin.email },
    { role: "OWNER", email: owner1.email },
    { role: "OWNER", email: owner2.email },
    { role: "USER", email: user.email },
  ])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
