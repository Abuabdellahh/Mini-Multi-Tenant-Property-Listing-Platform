import "server-only"
import { prisma } from "@/lib/server/db"
import { hashPassword, verifyPassword, type SessionUser } from "@/lib/server/auth"
import { Conflict, Unauthorized } from "@/lib/server/http"
import type { LoginInput, RegisterInput } from "@/lib/validation"

function toSession(u: {
  id: string
  email: string
  role: string
  tenantId: string
  name: string | null
}): SessionUser {
  return { id: u.id, email: u.email, role: u.role as SessionUser["role"], tenantId: u.tenantId, name: u.name }
}

export const authService = {
  async register(input: RegisterInput): Promise<SessionUser> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw Conflict("An account with this email already exists")

    const passwordHash = await hashPassword(input.password)

    // An OWNER is a tenant: their tenantId equals their own id. We create the
    // row first, then set tenantId = id so ownership scoping is self-consistent.
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name ?? null,
        role: input.role,
        tenantId: "pending",
      },
    })
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: user.id },
    })
    return toSession(updated)
  },

  async login(input: LoginInput): Promise<SessionUser> {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user || user.deletedAt) throw Unauthorized("Invalid email or password")
    const ok = await verifyPassword(input.password, user.passwordHash)
    if (!ok) throw Unauthorized("Invalid email or password")
    return toSession(user)
  },
}
