"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users, Building2, CheckCircle2, FileText, Archive, Ban, Heart, EyeOff, Eye, MapPin } from "lucide-react"
import { toast } from "sonner"
import { RequireRole } from "@/components/require-role"
import { CenteredSpinner, ErrorState, EmptyState } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, ApiError } from "@/lib/api-client"
import { formatPrice, STATUS_STYLES } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AdminMetrics, Paginated, Property, PropertyStatus } from "@/lib/types"

function errMsg(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback
}

const STATUS_FILTERS: { label: string; value: PropertyStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
]

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function AdminDashboard() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<PropertyStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const metrics = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => api.get<AdminMetrics>("/api/admin/metrics"),
  })

  const propsKey = ["admin-properties", status, page] as const
  const list = useQuery({
    queryKey: propsKey,
    queryFn: () => {
      const sp = new URLSearchParams({ page: String(page), pageSize: "10" })
      if (status !== "ALL") sp.set("status", status)
      return api.get<Paginated<Property>>(`/api/admin/properties?${sp.toString()}`)
    },
  })

  const disable = useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) =>
      api.post(`/api/admin/properties/${id}/disable`, { disabled }),
    onSuccess: (_r, v) => {
      toast.success(v.disabled ? "Property disabled" : "Property re-enabled")
      qc.invalidateQueries({ queryKey: ["admin-properties"] })
      qc.invalidateQueries({ queryKey: ["admin-metrics"] })
    },
    onError: (e) => toast.error(errMsg(e, "Could not update property")),
  })

  const m = metrics.data
  const items = list.data?.items ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Admin console</h1>
        <p className="text-sm text-muted-foreground">Cross-tenant oversight of every listing and account.</p>
      </div>

      {/* Metrics */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Platform metrics</h2>
        {metrics.isLoading ? (
          <CenteredSpinner />
        ) : metrics.isError ? (
          <ErrorState message={errMsg(metrics.error, "Failed to load metrics")} retry={() => metrics.refetch()} />
        ) : m ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard icon={<Users className="size-4" />} label="Users" value={m.totalUsers} />
            <MetricCard icon={<Building2 className="size-4" />} label="Properties" value={m.totalProperties} />
            <MetricCard icon={<CheckCircle2 className="size-4" />} label="Published" value={m.propertiesByStatus.PUBLISHED} />
            <MetricCard icon={<FileText className="size-4" />} label="Drafts" value={m.propertiesByStatus.DRAFT} />
            <MetricCard icon={<Archive className="size-4" />} label="Archived" value={m.propertiesByStatus.ARCHIVED} />
            <MetricCard icon={<Ban className="size-4" />} label="Disabled" value={m.disabledByAdmin} />
            <MetricCard icon={<Heart className="size-4" />} label="Favorites" value={m.totalFavorites} />
            <MetricCard icon={<Users className="size-4" />} label="Owners" value={m.usersByRole.OWNER} />
            <MetricCard icon={<Users className="size-4" />} label="Regular users" value={m.usersByRole.USER} />
            <MetricCard icon={<Users className="size-4" />} label="Admins" value={m.usersByRole.ADMIN} />
          </div>
        ) : null}
      </section>

      {/* Properties */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">All properties</h2>
          <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value)
                  setPage(1)
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  status === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {list.isLoading ? (
          <CenteredSpinner label="Loading properties…" />
        ) : list.isError ? (
          <ErrorState message={errMsg(list.error, "Failed to load properties")} retry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={<Building2 className="size-8" />} title="No properties match this filter" />
        ) : (
          <>
            <div className="space-y-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.title}</span>
                      <Badge className={cn("border", STATUS_STYLES[p.status])} variant="outline">
                        {p.status}
                      </Badge>
                      {p.disabledByAdmin && <Badge variant="destructive">Disabled</Badge>}
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {p.location} · {formatPrice(p.price)}
                      {p.owner && <span> · {p.owner.email}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === "PUBLISHED" && (
                      <Button variant="ghost" size="sm" render={<Link href={`/listings/${p.id}`} target="_blank" />}>
                        View
                      </Button>
                    )}
                    <Button
                      variant={p.disabledByAdmin ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => disable.mutate({ id: p.id, disabled: !p.disabledByAdmin })}
                      disabled={disable.isPending}
                    >
                      {p.disabledByAdmin ? (
                        <>
                          <Eye className="size-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-4" />
                          Disable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {list.data && list.data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {list.data.page} of {list.data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= list.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <AdminDashboard />
    </RequireRole>
  )
}
