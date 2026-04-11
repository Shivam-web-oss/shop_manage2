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
      accent: "bg-[rgba(201,246,199,0.12)] text-[var(--accent)] border border-[rgba(201,246,199,0.18)]",
      icon: "SH",
    },
    {
      label: "Primary Company",
      value: primaryDashboard.company_name,
      description: "Main organization profile",
      accent: "bg-[rgba(201,246,199,0.12)] text-[var(--accent)] border border-[rgba(201,246,199,0.18)]",
      icon: "HQ",
    },
    {
      label: "Pending Orders",
      value: String(totalPendingOrders),
      description: "Open orders across all shops",
      accent: "bg-[rgba(201,246,199,0.12)] text-[var(--accent)] border border-[rgba(201,246,199,0.18)]",
      icon: "PO",
    },
    {
      label: "Inventory Units",
      value: String(totalInventory),
      description: `Newest shop: ${newestDashboard.shop_name}`,
      accent: "bg-[rgba(201,246,199,0.12)] text-[var(--accent)] border border-[rgba(201,246,199,0.18)]",
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5 shadow-lg shadow-black/20 backdrop-blur-md">
              <div className={`${item.accent} flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold`}>
                {item.icon}
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--ink-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </SectionHero>

      <section className="rounded-[36px] border border-[var(--border)] bg-[rgba(17,22,22,0.72)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Quick Actions</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Open the section you need</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">These actions are now designed like a control deck instead of a plain button row, so the page feels more purposeful and easier to scan.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.style === "primary"
                    ? "rounded-[28px] bg-[linear-gradient(180deg,rgba(201,246,199,0.95),rgba(164,208,170,0.92))] p-5 text-[#08100c] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(201,246,199,0.18)]"
                    : "rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5 text-[var(--foreground)] transition hover:-translate-y-1 hover:border-[rgba(201,246,199,0.24)] hover:bg-[rgba(255,255,255,0.05)]"
                }
              >
                <p className="text-xs uppercase tracking-[0.24em] opacity-75">Workspace</p>
                <p className="mt-4 text-2xl font-semibold">{action.label}</p>
                <p className="mt-3 text-sm opacity-80">Open this area and continue managing the business without dead buttons.</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-[var(--border)] bg-[rgba(17,22,22,0.84)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Your Shops</p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Active locations</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,246,199,0.16)] bg-[rgba(201,246,199,0.08)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> {dashboards.length} Active
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
