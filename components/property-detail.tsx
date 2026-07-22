import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"
import { PropertyGallery } from "@/components/property-gallery"
import { FavoriteButton } from "@/components/favorite-button"
import { ContactOwner } from "@/components/contact-owner"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { Property } from "@/lib/types"

// Presentational detail view, shared by the public listing page (wrapped in the
// site header) and the admin dashboard route (wrapped in the sidebar shell).
export function PropertyDetail({
  property,
  backHref,
  backLabel,
}: {
  property: Property
  backHref: string
  backLabel: string
}) {
  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4" render={<Link href={backHref} />}>
        <ArrowLeft className="size-4" />
        {backLabel}
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <PropertyGallery images={property.images} title={property.title} />
          <div>
            <h2 className="mb-2 font-serif text-xl font-semibold tracking-tight">About this property</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {property.description}
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
            <div>
              <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                {property.title}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {property.location}
              </p>
            </div>

            <p className="text-3xl font-semibold text-primary">
              {formatPrice(property.price)}
              <span className="text-base font-normal text-muted-foreground"> / mo</span>
            </p>

            <div className="flex flex-col gap-2">
              <FavoriteButton propertyId={property.id} withLabel className="w-full justify-center" />
              <ContactOwner title={property.title} />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
