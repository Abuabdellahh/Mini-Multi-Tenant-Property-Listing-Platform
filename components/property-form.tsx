"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Property } from "@/lib/types"

export interface PropertyFormValues {
  title: string
  description: string
  location: string
  price: number
  images: { url: string; mimeType: string; sizeBytes: number }[]
}

function mimeFromUrl(url: string): string {
  const clean = url.split("?")[0].toLowerCase()
  if (clean.endsWith(".png")) return "image/png"
  if (clean.endsWith(".webp")) return "image/webp"
  return "image/jpeg"
}

export function PropertyForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
  error,
}: {
  initial?: Property
  submitLabel: string
  onSubmit: (values: PropertyFormValues) => void
  pending?: boolean
  error?: string | null
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [location, setLocation] = useState(initial?.location ?? "")
  const [price, setPrice] = useState<string>(initial ? String(initial.price) : "")
  const [images, setImages] = useState<PropertyFormValues["images"]>(
    initial?.images?.map((i) => ({ url: i.url, mimeType: i.mimeType, sizeBytes: i.sizeBytes })) ?? [],
  )
  const [imageUrl, setImageUrl] = useState("")
  const [imageError, setImageError] = useState<string | null>(null)

  function addImage() {
    const url = imageUrl.trim()
    if (!url) return
    // External-URL image handling: validate it's an absolute http(s) URL. Type
    // is inferred from the extension and constrained server-side too.
    if (!/^https?:\/\//i.test(url)) {
      setImageError("Enter a full image URL starting with http:// or https://")
      return
    }
    setImages((prev) => [...prev, { url, mimeType: mimeFromUrl(url), sizeBytes: 0 }])
    setImageUrl("")
    setImageError(null)
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      price: Number(price) || 0,
      images,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Sunlit loft downtown" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Describe the property (at least 10 characters)…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Austin, TX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (USD / mo)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="2500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <p className="text-xs text-muted-foreground">
          Paste image URLs (JPEG, PNG, or WebP). At least one is required to publish.
        </p>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addImage()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addImage}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {imageError && <p className="text-xs text-destructive">{imageError}</p>}

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {images.map((img, i) => (
              <div key={`${img.url}-${i}`} className="group relative size-20 overflow-hidden rounded-lg ring-1 ring-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
