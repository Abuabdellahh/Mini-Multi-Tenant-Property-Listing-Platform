import { handle, json } from "@/lib/server/http"
import { clearSessionCookie } from "@/lib/server/auth"

// POST /api/auth/logout — clear the session cookie.
export const POST = handle(async () => {
  await clearSessionCookie()
  return json({ ok: true })
})
