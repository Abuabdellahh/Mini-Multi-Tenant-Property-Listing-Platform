import { NextResponse } from "next/server"
import { ZodError } from "zod"

// Central HTTP error type — services throw these, the route wrapper maps them
// to correct status codes. This is the Next.js equivalent of Nest's global
// exception filter: error->status mapping lives in ONE place.
export class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code ?? httpCodeFor(status)
    this.details = details
  }
}

function httpCodeFor(status: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    500: "INTERNAL_ERROR",
  }
  return map[status] ?? "ERROR"
}

// Convenience constructors
export const BadRequest = (m: string, d?: unknown) => new HttpError(400, m, "BAD_REQUEST", d)
export const Unauthorized = (m = "Authentication required") => new HttpError(401, m, "UNAUTHORIZED")
export const Forbidden = (m = "You do not have permission to perform this action") =>
  new HttpError(403, m, "FORBIDDEN")
export const NotFound = (m = "Resource not found") => new HttpError(404, m, "NOT_FOUND")
export const Conflict = (m: string) => new HttpError(409, m, "CONFLICT")
export const Unprocessable = (m: string, d?: unknown) => new HttpError(422, m, "UNPROCESSABLE_ENTITY", d)

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

// Wraps a route handler so any thrown HttpError/ZodError becomes a clean,
// correctly-coded JSON response. Keeps handlers free of try/catch noise.
export function handle(
  fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "UNPROCESSABLE_ENTITY",
            details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          },
          { status: 422 },
        )
      }
      if (err instanceof HttpError) {
        return NextResponse.json(
          { error: err.message, code: err.code, details: err.details ?? undefined },
          { status: err.status },
        )
      }
      console.log("[v0] Unhandled API error:", err)
      return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
    }
  }
}
