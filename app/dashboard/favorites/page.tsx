"use client"

import Link from "next/link"
import { Heart, Search } from "lucide-react"
import { RequireRole } from "@/components/require-role"
import { PropertyCard } from "@/components/property-card"
import { EmptyState, CenteredSpinner } from "@/components/states"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/hooks/use-favorites"

function Favorites() {
  const fav = useFavorites()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Saved properties</h1>
        <p className="text-sm text-muted-foreground">
          Your favorites, synced live across every open tab.
        </p>
      </div>

      {fav.isLoading ? (
        <CenteredSpinner label="Loading favorites…" />
      ) : fav.items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="No favorites yet"
          description="Browse the marketplace and tap the heart on any listing to save it here."
          action={
            <Button render={<Link href="/listings" />}>
              <Search className="size-4" />
              Browse listings
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fav.items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  return (
    <RequireRole roles={["USER"]}>
      <Favorites />
    </RequireRole>
  )
}
