"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Home className="size-4" />
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight">Estate</span>
    </Link>
  )
}

function initials(name?: string | null, email?: string) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
  }
  return (email?.[0] ?? "?").toUpperCase()
}

export function SiteHeader() {
  const { user, hydrated, logout, dashboardPath } = useAuth()
  const pathname = usePathname()

  const roleLabel =
    user?.role === "ADMIN" ? "Admin" : user?.role === "OWNER" ? "Owner" : "Member"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <BrandMark />
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/listings"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith("/listings") && "text-foreground",
              )}
            >
              Browse
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!hydrated ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                        {initials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm sm:inline">
                      {user.name ?? user.email}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate">{user.name ?? "Account"}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.email} · {roleLabel}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={dashboardPath()} />}>
                  {user.role === "ADMIN" ? (
                    <ShieldCheck className="size-4" />
                  ) : user.role === "OWNER" ? (
                    <LayoutDashboard className="size-4" />
                  ) : (
                    <Heart className="size-4" />
                  )}
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/listings" />}>
                  <Home className="size-4" />
                  Browse listings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} variant="destructive">
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
