import "server-only"
import { getSession, type Role, type SessionUser } from "./auth"
import { Forbidden, Unauthorized } from "./http"

// RBAC lives HERE — the Next.js equivalent of Nest Guards. Every protected
// route calls requireAuth()/requireRole() rather than re-checking roles inline,
// so authorization logic is centralized and auditable.

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) throw Unauthorized()
  return user
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw Forbidden(`Requires role: ${roles.join(" or ")}`)
  }
  return user
}
