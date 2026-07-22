"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Users,
  Building2,
  CheckCircle2,
  Heart,
  Ban,
  EyeOff,
  Eye,
  MapPin,
  ExternalLink,
  TrendingUp,
} from "lucide-react"
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

// Colored dot + bar segment per status, kept as static classes so Tailwind
// can see them at build time.
const STATUS_BAR: Record<PropertyStatus, { dot: string; bar: string; label: string }> = {
  PUBLISHED: { dot: "bg-primary", bar: "bg-primary", label: "Published" },
  DRAFT: { dot: "bg-muted-foreground/50", bar: "bg-muted-foreground/40", label: "Draft" },
  ARCHIVED: { dot: "bg-amber-500/70", bar: "bg-amber-500/60", label: "Archived" },
}

/* ---------------------------------- Stats --------------------------------- */

function StatCard({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: number
  hint?: string
  tint: string
}) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tint)}>{icon}</div>
        {hint && <TrendingUp className="size-4 text-muted-foreground/40" />}
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function StatusBreakdown({ m }: { m: AdminMetrics }) {
  const total = m.totalProperties || 1
  const order: PropertyStatus[] = ["PUBLISHED", "DRAFT", "ARCHIVED"]
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Listings by status</h3>
        {m.disabledByAdmin > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Ban className="size-3" />
            {m.disabledByAdmin} disabled
          </Badge>
        )}
      </div>

      {/* Segmented bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {order.map((s) => {
          const n = m.propertiesByStatus[s]
          if (!n) return null
          return (
            <div
              key={s}
              className={cn("h-full", STATUS_BAR[s].bar)}
              style={{ width: `${(n / total) * 100}%` }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <ul className="mt-4 space-y-2">
        {order.map((s) => (
          <li key={s} className="flex items-center gap-2 text-sm">
            <span className={cn("size-2.5 rounded-full", STATUS_BAR[s].dot)} />
            <span className="text-muted-foreground">{STATUS_BAR[s].label}</span>
            <span className="ml-auto font-medium tabular-nums">{m.propertiesByStatus[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RoleBreakdown({ m }: { m: AdminMetrics }) {
  const rows = [
    { label: "Owners", value: m.usersByRole.OWNER },
    { label: "Members", value: m.usersByRole.USER },
    { label: "Admins", value: m.usersByRole.ADMIN },
  ]
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h3 className="mb-4 text-sm font-medium">Accounts by role</h3>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="ml-auto font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------- Property -------------------------------- */

function PropertyRow({
  p,
  onToggle,
  pending,
}: {
  p: Property
  onToggle: (disabled: boolean) => void
  pending: boolean
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 hover:shadow-sm sm:flex-row sm:items-center">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-20">
        {p.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.images[0].url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{p.title}</span>
          <Badge className={cn("gap-1 border", STATUS_STYLES[p.status])} variant="outline">
            {p.status}
          </Badge>
          {p.disabledByAdmin && (
            <Badge variant="destructive" className="gap-1">
              <Ban className="size-3" />
              Disabled
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {p.location}
          </span>
          <span className="font-semibold text-foreground">{formatPrice(p.price)}</span>
          {p.owner && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs">
              <Users className="size-3" />
              {p.owner.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:pr-1">
        {p.status === "PUBLISHED" && (
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/admin/properties/${p.id}`} />}>
            <ExternalLink className="size-4" />
            View
          </Button>
        )}
        <Button
          variant={p.disabledByAdmin ? "outline" : "destructive"}
          size="sm"
          onClick={() => onToggle(!p.disabledByAdmin)}
          disabled={pending}
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
  )
}

/* -------------------------------- Dashboard ------------------------------- */

function AdminDashboard() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<PropertyStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const metrics = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => api.get<AdminMetrics>("/api/admin/metrics"),
  })

  const list = useQuery({
    queryKey: ["admin-properties", status, page] as const,
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
  const published = m ? Math.round((m.propertiesByStatus.PUBLISHED / (m.totalProperties || 1)) * 100) : 0

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Admin console</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-tenant oversight of every listing and account.
        </p>
      </header>

      {/* Metrics */}
      <section>
        {metrics.isLoading ? (
          <CenteredSpinner />
        ) : metrics.isError ? (
          <ErrorState message={errMsg(metrics.error, "Failed to load metrics")} retry={() => metrics.refetch()} />
        ) : m ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<Users className="size-5" />}
                tint="bg-primary/10 text-primary"
                label="Users"
                value={m.totalUsers}
                hint={`${m.usersByRole.OWNER} owners · ${m.usersByRole.USER} members`}
              />
              <StatCard
                icon={<Building2 className="size-5" />}
                tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
                label="Properties"
                value={m.totalProperties}
                hint={`${m.propertiesByStatus.DRAFT} in draft`}
              />
              <StatCard
                icon={<CheckCircle2 className="size-5" />}
                tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                label="Published"
                value={m.propertiesByStatus.PUBLISHED}
                hint={`${published}% of all listings`}
              />
              <StatCard
                icon={<Heart className="size-5" />}
                tint="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                label="Favorites"
                value={m.totalFavorites}
                hint="saves across all users"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <StatusBreakdown m={m} />
              <RoleBreakdown m={m} />
            </div>
          </div>
        ) : null}
      </section>

      {/* Properties */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold tracking-tight">All properties</h2>
            {list.data && (
              <p className="text-sm text-muted-foreground">
                {list.data.total} listing{list.data.total === 1 ? "" : "s"} across every tenant
              </p>
            )}
          </div>
          <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value)
                  setPage(1)
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  status === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
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
            <div className="space-y-2.5">
              {items.map((p) => (
                <PropertyRow
                  key={p.id}
                  p={p}
                  pending={disable.isPending}
                  onToggle={(disabled) => disable.mutate({ id: p.id, disabled })}
                />
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
