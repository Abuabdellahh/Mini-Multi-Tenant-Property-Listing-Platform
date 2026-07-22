// Shared client/server DTO types. These mirror what the API route handlers
// return (Prisma models serialized to JSON), so the frontend stays typed.

export type Role = "ADMIN" | "OWNER" | "USER"
export type PropertyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export interface AuthUser {
  id: string
  email: string
  role: Role
  tenantId: string
  name?: string | null
}

export interface PropertyImage {
  id: string
  propertyId: string
  url: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface Property {
  id: string
  tenantId: string
  title: string
  description: string
  location: string
  price: number
  status: PropertyStatus
  disabledByAdmin: boolean
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  deletedAt: string | null
  images: PropertyImage[]
  owner?: { id: string; email: string; name: string | null }
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminMetrics {
  totalUsers: number
  usersByRole: Record<Role, number>
  totalProperties: number
  propertiesByStatus: Record<PropertyStatus, number>
  disabledByAdmin: number
  totalFavorites: number
}
