import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Edge proxy = coarse route protection (is there a valid session?).
// Fine-grained RBAC still runs server-side in the API guards; this just keeps
// unauthenticated users out of the dashboard shells and redirects nicely.
const SESSION_COOKIE = "pp_session"
const PROTECTED_PREFIXES = ["/dashboard"]

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await isValid(token)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
