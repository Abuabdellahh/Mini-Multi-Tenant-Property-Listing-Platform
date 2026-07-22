"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { CenteredSpinner } from "@/components/states"
import type { Role } from "@/lib/types"

// Client-side route guard. The edge proxy already blocks unauthenticated users
// from /dashboard; this adds fine-grained ROLE gating and redirects a signed-in
// user to their own dashboard if they hit one they aren't allowed to see.
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user, hydrated, dashboardPath } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!roles.includes(user.role)) {
      router.replace(dashboardPath(user.role))
    }
  }, [hydrated, user, roles, router, dashboardPath])

  if (!hydrated || !user || !roles.includes(user.role)) {
    return <CenteredSpinner label="Checking access…" />
  }
  return <>{children}</>
}
