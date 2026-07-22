import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-muted/30">
      <DashboardSidebar />
      <div className="md:pl-64">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
