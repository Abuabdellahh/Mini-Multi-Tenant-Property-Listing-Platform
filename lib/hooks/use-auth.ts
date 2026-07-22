"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { AuthUser, Role } from "@/lib/types"

interface Credentials {
  email: string
  password: string
}
interface RegisterInput extends Credentials {
  name?: string
  role: "OWNER" | "USER"
}

// Central auth hook — components use this instead of poking the store directly.
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const setUser = useAuthStore((s) => s.setUser)
  const reset = useAuthStore((s) => s.reset)
  const router = useRouter()
  const qc = useQueryClient()

  const login = useMutation({
    mutationFn: (creds: Credentials) => api.post<{ user: AuthUser }>("/api/auth/login", creds),
    onSuccess: (res) => {
      setUser(res.user)
      qc.clear()
    },
  })

  const register = useMutation({
    mutationFn: (input: RegisterInput) => api.post<{ user: AuthUser }>("/api/auth/register", input),
    onSuccess: (res) => {
      setUser(res.user)
      qc.clear()
    },
  })

  async function logout() {
    await api.post("/api/auth/logout")
    reset()
    qc.clear()
    router.push("/")
    router.refresh()
  }

  function dashboardPath(role: Role | undefined = user?.role): string {
    switch (role) {
      case "ADMIN":
        return "/dashboard/admin"
      case "OWNER":
        return "/dashboard/owner"
      default:
        return "/dashboard/favorites"
    }
  }

  return { user, hydrated, login, register, logout, dashboardPath }
}
