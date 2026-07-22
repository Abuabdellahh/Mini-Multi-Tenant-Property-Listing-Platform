import { z } from "zod"

// Shared validation — imported by both server (source of truth) and client
// (fast feedback). Single definition avoids client/server drift.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  name: z.string().trim().min(1, "Name is required").max(80).optional(),
  // Self-service registration only allows OWNER or USER. Admins are seeded.
  role: z.enum(["OWNER", "USER"]).default("USER"),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
})
export type LoginInput = z.infer<typeof loginSchema>

const imageSchema = z.object({
  url: z.string().url("Each image must be a valid URL"),
  mimeType: z
    .enum(ALLOWED_IMAGE_TYPES)
    .or(z.string().refine((v) => ALLOWED_IMAGE_TYPES.includes(v as never), "Unsupported image type")),
  sizeBytes: z
    .number()
    .int()
    .min(0)
    .max(MAX_IMAGE_BYTES, "Images must be 5 MB or smaller")
    .optional()
    .default(0),
})

export const createPropertySchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(4000),
  location: z.string().trim().min(2, "Location is required").max(140),
  price: z.number().int("Price must be a whole number").min(0, "Price cannot be negative"),
  images: z.array(imageSchema).max(12, "A property can have at most 12 images").optional().default([]),
})
export type CreatePropertyInput = z.infer<typeof createPropertySchema>

// All fields optional on edit; still only allowed while DRAFT (enforced in service).
export const updatePropertySchema = createPropertySchema.partial()
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(9),
  location: z.string().trim().min(1).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
})
export type ListQuery = z.infer<typeof listQuerySchema>

export function validateImageClient(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as never)) {
    return "Only JPEG, PNG, or WebP images are allowed"
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be 5 MB or smaller"
  }
  return null
}
