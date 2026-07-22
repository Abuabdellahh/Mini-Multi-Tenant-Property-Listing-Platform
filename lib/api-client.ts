// Tiny fetch wrapper for client components. Always sends cookies (httpOnly
// session), parses JSON, and throws a typed ApiError with the server's message
// + status so React Query / forms can render precise error states.

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const payload = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message =
      (payload && (payload.error || payload.message)) || `Request failed (${res.status})`
    throw new ApiError(message, res.status, payload?.code, payload?.details)
  }
  return payload as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
