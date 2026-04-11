import Link from "next/link"
import { notFound } from "next/navigation"
import SectionHero from "@/app/components/dashboard/section-hero"
import { getDashboardById, getUserDashboards } from "@/lib/dashboard"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ShopDetailsPage({ params }: PageProps) {
  const { id } = await params
  const shop = await getDashboardById(id)

  if (!shop) {
    notFound()
  }

  const dashboards = await getUserDashboards()
  const shopIndex = dashboards.findIndex((item) => item.id === shop.id)
  const inventoryCount = 120 + shopIndex * 18
  const pendingOrders = 6 + shopIndex * 3
  const teamMembers = 8 + shopIndex * 2
  const returningCustomers = 35 + shopIndex * 5

  const highlights = [
    { label: "Inventory Coverage", value: `${inventoryCount} items tracked` },
    { label: "Pending Orders", value: `${pendingOrders} orders` },
    { label: "Active Staff", value: `${teamMembers} team members` },
    { label: "Returning Customers", value: `${returningCustomers} this month` },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SectionHero
        eyebrow="Shop Details"
        title={shop.shop_name}
        description={`${shop.company_name} in ${shop.location}. This page gives your team a reliable landing spot for the shop card buttons, with a clean overview and direct links to the main operational sections.`}
        primaryAction={{ href: "/dashboard/orders", label: "Manage Orders" }}
        secondaryAction={{ href: "/dashboard/inventory", label: "View Inventory" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5 shadow-lg shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionHero>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-[var(--border)] bg-[rgba(17,22,22,0.84)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Profile</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">About this shop</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            {shop.description || "No description has been saved yet. You can still use this shop page as the hub for inventory, order handling, customers, and reporting."}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Company</dt>
              <dd className="mt-2 text-lg font-semibold text-[var(--foreground)]">{shop.company_name}</dd>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Location</dt>
              <dd className="mt-2 text-lg font-semibold text-[var(--foreground)]">{shop.location}</dd>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Created</dt>
              <dd className="mt-2 text-lg font-semibold text-[var(--foreground)]">{new Date(shop.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Status</dt>
              <dd className="mt-2 text-lg font-semibold text-emerald-300">Active</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[36px] border border-[var(--border)] bg-[linear-gradient(160deg,rgba(18,22,22,0.98),rgba(24,32,31,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Action Deck</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Next actions</h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/dashboard/inventory" className="rounded-[24px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#08100c] transition hover:bg-[#dbffda]">
              Open inventory workspace
            </Link>
            <Link href="/dashboard/orders" className="rounded-[24px] border border-[var(--border)] bg-white/4 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/6">
              Check pending orders
            </Link>
            <Link href="/dashboard/customers" className="rounded-[24px] border border-[var(--border)] bg-white/4 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/6">
              Review customer activity
            </Link>
            <Link href="/dashboard/reports" className="rounded-[24px] border border-[var(--border)] bg-white/4 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/6">
              View performance reports
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}
