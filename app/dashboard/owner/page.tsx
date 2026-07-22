"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Rocket, Archive, Trash2, MapPin, ExternalLink, Building2 } from "lucide-react"
import { toast } from "sonner"
import { RequireRole } from "@/components/require-role"
import { PropertyForm, type PropertyFormValues } from "@/components/property-form"
import { EmptyState, CenteredSpinner, ErrorState } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api-client"
import { formatPrice, STATUS_STYLES } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Property } from "@/lib/types"

const KEY = ["owner-properties"]

function errMsg(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback
}

function OwnerDashboard() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => api.get<{ items: Property[] }>("/api/properties"),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

  const create = useMutation({
    mutationFn: (values: PropertyFormValues) => api.post("/api/properties", values),
    onSuccess: () => {
      toast.success("Draft created")
      setCreating(false)
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not create listing")),
  })

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PropertyFormValues }) =>
      api.patch(`/api/properties/${id}`, values),
    onSuccess: () => {
      toast.success("Draft updated")
      setEditing(null)
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not update listing")),
  })

  const publish = useMutation({
    mutationFn: (id: string) => api.post(`/api/properties/${id}/publish`),
    onSuccess: () => {
      toast.success("Listing published")
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not publish")),
  })

  const archive = useMutation({
    mutationFn: (id: string) => api.post(`/api/properties/${id}/archive`),
    onSuccess: () => {
      toast.success("Listing archived")
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not archive")),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/properties/${id}`),
    onSuccess: () => {
      toast.success("Listing deleted")
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not delete")),
  })

  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Your listings</h1>
          <p className="text-sm text-muted-foreground">Create drafts, publish them, and manage what's live.</p>
        </div>
        <Button size="lg" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New listing
        </Button>
      </div>

      {isLoading ? (
        <CenteredSpinner label="Loading your listings…" />
      ) : isError ? (
        <ErrorState message={errMsg(error, "Failed to load listings")} retry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="No listings yet"
          description="Create your first draft, add images, then publish it to go live."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Create a listing
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center"
            >
              <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.title}</span>
                  <Badge className={cn("border", STATUS_STYLES[p.status])} variant="outline">
                    {p.status}
                  </Badge>
                  {p.disabledByAdmin && <Badge variant="destructive">Disabled by admin</Badge>}
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {p.location} · {formatPrice(p.price)} · {p.images.length} image{p.images.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {p.status === "PUBLISHED" && (
                  <Button variant="ghost" size="sm" render={<Link href={`/listings/${p.id}`} target="_blank" />}>
                    <ExternalLink className="size-4" />
                    View
                  </Button>
                )}
                {p.status === "DRAFT" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => publish.mutate(p.id)}
                      disabled={publish.isPending}
                    >
                      <Rocket className="size-4" />
                      Publish
                    </Button>
                  </>
                )}
                {p.status === "PUBLISHED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archive.mutate(p.id)}
                    disabled={archive.isPending}
                  >
                    <Archive className="size-4" />
                    Archive
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"? This can't be undone.`)) remove.mutate(p.id)
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New listing</DialogTitle>
            <DialogDescription>Saved as a draft. You can publish it once it has an image and a price.</DialogDescription>
          </DialogHeader>
          <PropertyForm
            submitLabel="Create draft"
            pending={create.isPending}
            onSubmit={(values) => create.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit (drafts only) */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit draft</DialogTitle>
            <DialogDescription>Only drafts can be edited — published listings are immutable.</DialogDescription>
          </DialogHeader>
          {editing && (
            <PropertyForm
              initial={editing}
              submitLabel="Save changes"
              pending={update.isPending}
              onSubmit={(values) => update.mutate({ id: editing.id, values })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OwnerDashboardPage() {
  return (
    <RequireRole roles={["OWNER"]}>
      <OwnerDashboard />
    </RequireRole>
  )
}
