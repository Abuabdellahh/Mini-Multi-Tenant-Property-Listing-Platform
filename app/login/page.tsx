"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/use-auth"
import { ApiError } from "@/lib/api-client"

const DEMO = [
  { role: "Admin", email: "admin@example.com" },
  { role: "Owner", email: "owner@example.com" },
  { role: "User", email: "user@example.com" },
]
const DEMO_PASSWORD = "Password123!"

function LoginForm() {
  const { login, user, hydrated, dashboardPath } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Already signed in? Skip the form.
  useEffect(() => {
    if (hydrated && user) router.replace(next || dashboardPath(user.role))
  }, [hydrated, user, next, router, dashboardPath])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate(
      { email, password },
      { onSuccess: (res) => router.replace(next || dashboardPath(res.user.role)) },
    )
  }

  const error = login.error instanceof ApiError ? login.error.message : null

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Home className="size-5" />
        </span>
        <span className="font-serif text-xl font-semibold tracking-tight">Estate</span>
      </Link>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to manage your listings and favorites.</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Demo accounts · password <code className="text-foreground">{DEMO_PASSWORD}</code>
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <Button
              key={d.email}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail(d.email)
                setPassword(DEMO_PASSWORD)
              }}
            >
              {d.role}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
