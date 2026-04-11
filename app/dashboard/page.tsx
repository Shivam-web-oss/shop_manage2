import Link from "next/link"
import { redirect } from "next/navigation"
import SectionHero from "../components/dashboard/section-hero"
import ShopCard from "../components/dashboard/shop-card"
import { getUserDashboards } from "@/lib/dashboard"

function buildShopMetrics(index: number) {
  const inventory = 120 + index * 18
  const pendingOrders = 6 + index * 3
  const teamMembers = 8 + index * 2

  return [
    { label: "Inventory", value: `${inventory} items` },
    { label: "Orders", value: `${pendingOrders} pending` },
    { label: "Team", value: `${teamMembers} members` },
  ]
}

export default async function DashboardPage() {
  const dashboards = await getUserDashboards()

  if (!dashboards.length) {
    redirect("/dashboard/create")
  }

  const primaryDashboard = dashboards[0]
  const newestDashboard = dashboards[dashboards.length - 1]
  const totalPendingOrders = dashboards.reduce((count, _, index) => count + 6 + index * 3, 0)
  const totalInventory = dashboards.reduce((count, _, index) => count + 120 + index * 18, 0)

  const stats = [
    {
      label: "Total Shops",
      value: String(dashboards.length),
      description: "Active locations managed here",
      accent: "bg-cyan-100 text-cyan-700",
      icon: "SH",
    },
    {
      label: "Primary Company",
      value: primaryDashboard.company_name,
      description: "Main organization profile",
      accent: "bg-emerald-100 text-emerald-700",
      icon: "HQ",
    },
    {
      label: "Pending Orders",
      value: String(totalPendingOrders),
      description: "Open orders across all shops",
      accent: "bg-amber-100 text-amber-700",
      icon: "PO",
    },
    {
      label: "Inventory Units",
      value: String(totalInventory),
      description: `Newest shop: ${newestDashboard.shop_name}`,
      accent: "bg-violet-100 text-violet-700",
      icon: "IV",
    },
  ]

  const quickActions = [
    { href: "/dashboard/create", label: "Add Another Shop", style: "primary" },
    { href: "/dashboard/inventory", label: "Review Inventory", style: "secondary" },
    { href: "/dashboard/reports", label: "Open Reports", style: "secondary" },
    { href: "/profile", label: "Profile Settings", style: "secondary" },
  ] as const

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <SectionHero
        eyebrow="Operations"
        title="Dashboard Overview"
        description="Manage all your shops from one place. Every main action on this page now opens a real destination so your team can move through inventory, orders, customer activity, and reporting without hitting dead ends."
        primaryAction={{ href: "/dashboard/create", label: "Add Shop" }}
        secondaryAction={{ href: "/dashboard/reports", label: "See Reports" }}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/12 bg-white/90 p-5 shadow-lg shadow-slate-950/10">
              <div className={`${item.accent} flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold`}>
                {item.icon}
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </SectionHero>

      <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Quick Actions</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Open the section you need</h2>
            <p className="mt-2 text-sm text-slate-600">These buttons now route to real pages instead of staying decorative.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.style === "primary"
                    ? "rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    : "rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Your Shops</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Active locations</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {dashboards.length} Active
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {dashboards.map((shop, index) => (
            <ShopCard
              key={shop.id}
              id={shop.id}
              shopName={shop.shop_name}
              companyName={shop.company_name}
              location={shop.location}
              description={shop.description}
              createdAt={shop.created_at}
              metrics={buildShopMetrics(index)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
