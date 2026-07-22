"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ListingsFilters({
  initial,
}: {
  initial: { location?: string; priceMin?: string; priceMax?: string }
}) {
  const router = useRouter()
  const [location, setLocation] = useState(initial.location ?? "")
  const [priceMin, setPriceMin] = useState(initial.priceMin ?? "")
  const [priceMax, setPriceMax] = useState(initial.priceMax ?? "")

  function apply(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.set("location", location.trim())
    if (priceMin.trim()) params.set("priceMin", priceMin.trim())
    if (priceMax.trim()) params.set("priceMax", priceMax.trim())
    // Filtering always resets to page 1.
    const qs = params.toString()
    router.push(qs ? `/listings?${qs}` : "/listings")
  }

  function clear() {
    setLocation("")
    setPriceMin("")
    setPriceMax("")
    router.push("/listings")
  }

  const hasFilters = location || priceMin || priceMax

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="f-location">Location</Label>
        <Input
          id="f-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-min">Min price</Label>
        <Input
          id="f-min"
          type="number"
          min={0}
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          placeholder="0"
          className="sm:w-28"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-max">Max price</Label>
        <Input
          id="f-max"
          type="number"
          min={0}
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          placeholder="Any"
          className="sm:w-28"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="lg">
          <Search className="size-4" />
          Search
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" size="lg" onClick={clear}>
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
