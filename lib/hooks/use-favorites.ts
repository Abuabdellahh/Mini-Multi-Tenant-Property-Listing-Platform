"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Property } from "@/lib/types"

interface FavoritesResponse {
  items: Property[]
  ids: string[]
}

const KEY = ["favorites"] as const
// Cross-tab channel: favoriting in one tab must update the others live. We use
// BroadcastChannel (primary) and fall back to the `storage` event for browsers
// without it — both required by the brief.
const CHANNEL = "pp-favorites"

function notifyOtherTabs() {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL)
      bc.postMessage(Date.now())
      bc.close()
    }
    localStorage.setItem(CHANNEL, String(Date.now()))
  } catch {
    /* storage may be unavailable — non-fatal */
  }
}

// Single source of truth for the current user's favorites + the heart toggle.
// Only Regular Users can favorite, so the query is disabled for everyone else.
export function useFavorites() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const enabled = user?.role === "USER"

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => api.get<FavoritesResponse>("/api/favorites"),
    enabled,
  })

  // Listen for changes from other tabs and refetch when they happen.
  useEffect(() => {
    if (!enabled) return
    const sync = () => qc.invalidateQueries({ queryKey: KEY })
    let bc: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(CHANNEL)
      bc.onmessage = sync
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHANNEL) sync()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      bc?.close()
      window.removeEventListener("storage", onStorage)
    }
  }, [enabled, qc])

  const toggle = useMutation({
    mutationFn: ({ propertyId, favorited }: { propertyId: string; favorited: boolean }) =>
      favorited
        ? api.delete(`/api/favorites/${propertyId}`)
        : api.post(`/api/favorites/${propertyId}`),
    // Optimistic update: flip the heart instantly, roll back on error.
    onMutate: async ({ propertyId, favorited }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<FavoritesResponse>(KEY)
      qc.setQueryData<FavoritesResponse>(KEY, (old) => {
        const base = old ?? { items: [], ids: [] }
        const ids = favorited
          ? base.ids.filter((id) => id !== propertyId)
          : [...base.ids, propertyId]
        const items = favorited ? base.items.filter((p) => p.id !== propertyId) : base.items
        return { items, ids }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY })
      notifyOtherTabs()
    },
  })

  const ids = query.data?.ids ?? []
  return {
    enabled,
    items: query.data?.items ?? [],
    ids,
    isLoading: query.isLoading,
    isFavorited: (id: string) => ids.includes(id),
    toggle: (propertyId: string) => toggle.mutate({ propertyId, favorited: ids.includes(propertyId) }),
    isToggling: toggle.isPending,
  }
}
