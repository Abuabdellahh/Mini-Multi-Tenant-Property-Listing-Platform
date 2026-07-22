import { handle, json } from "@/lib/server/http"
import { registerSchema } from "@/lib/validation"
import { authService } from "@/lib/server/services/auth.service"
import { setSessionCookie, signSession } from "@/lib/server/auth"

// POST /api/auth/register — create account (USER or OWNER) and start a session.
export const POST = handle(async (req) => {
  const body = registerSchema.parse(await req.json())
  const user = await authService.register(body)
  const token = await signSession(user)
  await setSessionCookie(token)
  return json({ user }, 201)
})
