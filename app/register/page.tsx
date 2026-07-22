"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Home, Building2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/use-auth"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type Role = "USER" | "OWNER"

function RegisterForm() {
  const { register, user, hydrated, dashboardPath } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("USER")

  useEffect(() => {
    if (hydrated && user) router.replace(next || dashboardPath(user.role))
  }, [hydrated, user, next, router, dashboardPath])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    register.mutate(
      { name: name || undefined, email, password, role },
      { onSuccess: (res) => router.replace(next || dashboardPath(res.user.role)) },
    )
  }

  const error = register.error instanceof ApiError ? register.error.message : null

  const roles: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "USER", label: "Browse & save", desc: "Find homes and favorite them", icon: <Heart className="size-4" /> },
    { value: "OWNER", label: "List properties", desc: "Publish and manage listings", icon: <Building2 className="size-4" /> },
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Home className="size-5" />
        </span>
        <span className="font-serif text-xl font-semibold tracking-tight">Estate</span>
      </Link>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="text-lg font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">Pick how you want to use Estate.</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                  role === r.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {r.icon}
                  {r.label}
                </span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
