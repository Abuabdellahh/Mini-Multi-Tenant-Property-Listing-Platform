import Link from "next/link"
import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import { formatPrice, STATUS_STYLES } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Property } from "@/lib/types"

// Presentational card reused across the public listing, favorites, and
// dashboards. `showFavorite` and `showStatus` tailor it per context.
export function PropertyCard({
  property,
  href,
  showFavorite = true,
  showStatus = false,
}: {
  property: Property
  href?: string
  showFavorite?: boolean
  showStatus?: boolean
}) {
  const link = href ?? `/listings/${property.id}`
  const cover = property.images?.[0]?.url

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <Link href={link} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          {showStatus && (
            <div className="absolute left-3 top-3 flex gap-1.5">
              <Badge className={cn("border", STATUS_STYLES[property.status])} variant="outline">
                {property.status}
              </Badge>
              {property.disabledByAdmin && (
                <Badge variant="destructive">Disabled</Badge>
              )}
            </div>
          )}
        </div>
      </Link>

      {showFavorite && (
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={property.id} className="bg-background/85 backdrop-blur" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={link} className="line-clamp-1 font-medium leading-snug hover:underline">
            {property.title}
          </Link>
          <span className="whitespace-nowrap font-semibold text-primary">
            {formatPrice(property.price)}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{property.description}</p>
      </div>
    </div>
  )
}
