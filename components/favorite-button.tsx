"use client"

import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { useFavorites } from "@/lib/hooks/use-favorites"
import { cn } from "@/lib/utils"

// The optimistic favorite toggle. Visible to Regular Users and signed-out
// visitors (who are nudged to log in); hidden for Owners/Admins since the
// permission matrix reserves favorites for Regular Users.
export function FavoriteButton({
  propertyId,
  className,
  withLabel = false,
}: {
  propertyId: string
  className?: string
  withLabel?: boolean
}) {
  const { user, hydrated } = useAuth()
  const router = useRouter()
  const fav = useFavorites()

  if (hydrated && user && user.role !== "USER") return null

  const active = fav.isFavorited(propertyId)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/listings/${propertyId}`)}`)
      return
    }
    fav.toggle(propertyId)
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size={withLabel ? "sm" : "icon-sm"}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(className)}
    >
      <Heart className={cn("size-4", active && "fill-current text-primary")} />
      {withLabel && (active ? "Saved" : "Save")}
    </Button>
  )
}
