import { handle, json } from "@/lib/server/http"
import { loginSchema } from "@/lib/validation"
import { authService } from "@/lib/server/services/auth.service"
import { setSessionCookie, signSession } from "@/lib/server/auth"

// POST /api/auth/login — verify credentials and start a session.
export const POST = handle(async (req) => {
  const body = loginSchema.parse(await req.json())
  const user = await authService.login(body)
  const token = await signSession(user)
  await setSessionCookie(token)
  return json({ user })
})
