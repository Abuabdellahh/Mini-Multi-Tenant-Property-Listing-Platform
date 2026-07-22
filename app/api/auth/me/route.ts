import { handle, json } from "@/lib/server/http"
import { getSession } from "@/lib/server/auth"

// GET /api/auth/me — returns the current session user, or null. Used by the
// client to rehydrate auth state on load (persists across refresh).
export const GET = handle(async () => {
  const user = await getSession()
  return json({ user })
})

export const dynamic = "force-dynamic"
