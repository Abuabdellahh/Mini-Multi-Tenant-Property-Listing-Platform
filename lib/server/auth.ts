import "server-only"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export type Role = "ADMIN" | "OWNER" | "USER"

export interface SessionUser {
  id: string
  email: string
  role: Role
  tenantId: string
  name?: string | null
}

export const SESSION_COOKIE = "pp_session"
const TOKEN_TTL = "7d"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to your environment variables.")
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role, tenantId: user.tenantId, name: user.name ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
      tenantId: String(payload.tenantId),
      name: (payload.name as string | null) ?? null,
    }
  } catch {
    return null
  }
}

// Reads and verifies the session from the httpOnly cookie. Returns null if
// there is no valid session. Used by RSC pages and route guards alike.
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
