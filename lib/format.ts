import type { PropertyStatus } from "@/lib/types"

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

export const STATUS_STYLES: Record<PropertyStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  PUBLISHED:
    "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15",
  ARCHIVED:
    "bg-accent text-accent-foreground border-accent-foreground/20",
}
