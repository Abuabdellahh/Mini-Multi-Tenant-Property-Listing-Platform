import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { PropertyDetail } from "@/components/property-detail"
import { propertyService } from "@/lib/server/services/property.service"
import { HttpError } from "@/lib/server/http"
import type { Property } from "@/lib/types"

// Admin preview of a listing that stays inside the dashboard sidebar shell
// (the /dashboard layout wraps this route), instead of bouncing to the public
// site-header page.
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
  return { title: property ? `${property.title} · Admin` : "Listing not found" }
}

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await load(id)
  if (!property) notFound()

  return <PropertyDetail property={property} backHref="/dashboard/admin" backLabel="Back to console" />
}
