import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, MapPin } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { PropertyGallery } from "@/components/property-gallery"
import { FavoriteButton } from "@/components/favorite-button"
import { ContactOwner } from "@/components/contact-owner"
import { Button } from "@/components/ui/button"
import { propertyService } from "@/lib/server/services/property.service"
import { formatPrice } from "@/lib/format"
import type { Property } from "@/lib/types"
import { HttpError } from "@/lib/server/http"

export const dynamic = "force-dynamic"

async function load(id: string): Promise<Property | null> {
  try {
    return (await propertyService.getPublic(id)) as unknown as Property
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null
    throw e
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const property = await load(id)
  return { title: property?.title ?? "Listing not found" }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await load(id)
  if (!property) notFound()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" render={<Link href="/listings" />}>
          <ArrowLeft className="size-4" />
          Back to listings
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
      </main>
    </>
  )
}
