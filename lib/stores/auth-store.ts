"use client"

import { create } from "zustand"
import type { AuthUser } from "@/lib/types"

// Thin Zustand store: holds the current session user + a `hydrated` flag so the
// UI knows whether the initial /api/auth/me check has completed. The token
// itself lives in an httpOnly cookie (not here) — this only mirrors identity.

interface AuthState {
  user: AuthUser | null
  hydrated: boolean
  setUser: (user: AuthUser | null) => void
  setHydrated: (hydrated: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set({ user: null }),
}))
