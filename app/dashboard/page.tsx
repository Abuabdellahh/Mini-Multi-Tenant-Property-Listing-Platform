"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { CenteredSpinner } from "@/components/states"

// /dashboard is a role router: send each user to their own dashboard.
export default function DashboardIndex() {
  const { user, hydrated, dashboardPath } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    router.replace(user ? dashboardPath(user.role) : "/login")
  }, [hydrated, user, router, dashboardPath])

  return <CenteredSpinner label="Redirecting…" />
}
