import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { PropertyCard } from "@/components/property-card"
import { ListingsFilters } from "@/components/listings-filters"
import { Button } from "@/components/ui/button"
import { propertyService } from "@/lib/server/services/property.service"
import { listQuerySchema } from "@/lib/validation"
import type { Property } from "@/lib/types"

export const metadata: Metadata = { title: "Browse listings" }

// Server-side rendered public listing with pagination + filtering, exactly as
// the brief requires. Filters/pages live in the URL so results are shareable.
export const dynamic = "force-dynamic"

function buildHref(params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams()
  if (params.location) sp.set("location", params.location)
  if (params.priceMin) sp.set("priceMin", params.priceMin)
  if (params.priceMax) sp.set("priceMax", params.priceMax)
  sp.set("page", String(page))
  return `/listings?${sp.toString()}`
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const raw = await searchParams
  // Parse + coerce with the same schema the API uses; invalid values fall back.
  const query = listQuerySchema.parse({
    page: raw.page,
    location: raw.location,
    priceMin: raw.priceMin,
    priceMax: raw.priceMax,
  })
  const result = await propertyService.listPublic(query)
  const items = result.items as unknown as Property[]
  const { page, totalPages, total } = result

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Browse listings</h1>
          <p className="text-sm text-muted-foreground">
            {total} published home{total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mb-8">
          <ListingsFilters initial={{ location: raw.location, priceMin: raw.priceMin, priceMax: raw.priceMax }} />
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-20 text-center">
            <p className="font-medium">No listings match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try widening your price range or clearing the location.</p>
            <Button variant="outline" className="mt-4" render={<Link href="/listings" />}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={page <= 1}
                  render={page <= 1 ? <span /> : <Link href={buildHref(raw, page - 1)} />}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={page >= totalPages}
                  render={page >= totalPages ? <span /> : <Link href={buildHref(raw, page + 1)} />}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
