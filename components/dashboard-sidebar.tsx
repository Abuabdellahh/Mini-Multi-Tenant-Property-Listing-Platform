"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Heart,
  Search,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
type NavSection = { label: string; items: NavItem[] }

// Role-aware navigation. The layout is shared across every dashboard, so the
// sidebar shows only the destinations that make sense for the signed-in role.
const NAV: Record<Role, NavSection[]> = {
  ADMIN: [
    { label: "Console", items: [{ href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard }] },
    { label: "Marketplace", items: [{ href: "/listings", label: "Browse listings", icon: Building2 }] },
  ],
  OWNER: [
    { label: "Manage", items: [{ href: "/dashboard/owner", label: "My listings", icon: Building2 }] },
    { label: "Marketplace", items: [{ href: "/listings", label: "Browse", icon: Search }] },
  ],
  USER: [
    { label: "Me", items: [{ href: "/dashboard/favorites", label: "Saved properties", icon: Heart }] },
    { label: "Marketplace", items: [{ href: "/listings", label: "Browse", icon: Search }] },
  ],
}

const ROLE_META: Record<Role, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  ADMIN: { label: "Administrator", icon: ShieldCheck },
  OWNER: { label: "Owner", icon: LayoutDashboard },
  USER: { label: "Member", icon: Heart },
}

function initials(name?: string | null, email?: string) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
  }
  return (email?.[0] ?? "?").toUpperCase()
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  if (!user) return null

  const sections = NAV[user.role]
  const role = ROLE_META[user.role]
  const RoleIcon = role.icon

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Home className="size-4" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">Estate</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary/15 text-xs text-sidebar-primary">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
            <p className="flex items-center gap-1 truncate text-xs text-sidebar-foreground/60">
              <RoleIcon className="size-3" />
              {role.label}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"
          onClick={() => logout()}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Desktop: fixed rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
        <SidebarBody />
      </aside>

      {/* Mobile: top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar/95 px-4 backdrop-blur-md md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Home className="size-3.5" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Estate</span>
        </Link>
      </div>

      {/* Mobile: drawer + overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 z-10"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </Button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
