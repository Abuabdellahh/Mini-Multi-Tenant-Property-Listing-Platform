"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PropertyImage } from "@/lib/types"

export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [active, setActive] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ImageOff className="size-8" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].url} alt={title} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "size-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 transition",
                i === active ? "ring-2 ring-primary" : "ring-foreground/10 hover:ring-foreground/30",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
