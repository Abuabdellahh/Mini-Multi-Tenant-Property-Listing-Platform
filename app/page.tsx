import Link from "next/link"
import { ArrowRight, Building2, ShieldCheck, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { propertyService } from "@/lib/server/services/property.service"
import type { Property } from "@/lib/types"

// SSR: the marketplace is rendered on the server so listings are indexable and
// fast on first paint. Dynamic because it reads live data on every request.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const { items, total } = await propertyService.listPublic({ page: 1, pageSize: 6 } as never)
  const featured = items as unknown as Property[]

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Building2 className="size-3.5" /> Multi-tenant property marketplace
            </p>
            <h1 className="mx-auto max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Find your next place, or list your own.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
              Browse published homes from owners across the platform, save your favorites, and manage
              your own listings — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" render={<Link href="/listings" />}>
                <Search className="size-4" />
                Browse listings
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/register" />}>
                Get started
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Featured listings</h2>
              <p className="text-sm text-muted-foreground">
                {total} published home{total === 1 ? "" : "s"} available
              </p>
            </div>
            <Button variant="ghost" render={<Link href="/listings" />}>
              View all <ArrowRight className="size-4" />
            </Button>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
              No published listings yet. Sign in as an owner to create the first one.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </section>

        {/* Roles strip */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
            {[
              { icon: <Search className="size-5" />, title: "Regular users", body: "Browse published homes, save favorites synced across your tabs, and contact owners." },
              { icon: <Building2 className="size-5" />, title: "Owners", body: "Create drafts, upload images, and publish listings that go live instantly." },
              { icon: <ShieldCheck className="size-5" />, title: "Admins", body: "Oversee every tenant, disable listings, and monitor platform metrics." },
            ].map((r) => (
              <div key={r.title} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {r.icon}
                </div>
                <h3 className="font-medium">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          Estate — a demo multi-tenant property listing platform.
        </div>
      </footer>
    </>
  )
}
