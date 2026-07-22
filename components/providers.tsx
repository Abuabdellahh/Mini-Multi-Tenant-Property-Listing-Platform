"use client"

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { AuthUser } from "@/lib/types"

// Rehydrates the auth session on first load by calling /api/auth/me (reads the
// httpOnly cookie server-side), then flips `hydrated` so protected UIs can stop
// showing a loading state. This is what "persist auth across refresh" means here.
function SessionHydrator({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setHydrated = useAuthStore((s) => s.setHydrated)

  useEffect(() => {
    let active = true
    api
      .get<{ user: AuthUser | null }>("/api/auth/me")
      .then((res) => {
        if (active) setUser(res.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setHydrated(true)
      })
    return () => {
      active = false
    }
  }, [setUser, setHydrated])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionHydrator>{children}</SessionHydrator>
    </QueryClientProvider>
  )
}
