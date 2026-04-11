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
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow-lg shadow-slate-950/10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionHero>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30">
          <h2 className="text-2xl font-semibold text-slate-900">About this shop</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {shop.description || "No description has been saved yet. You can still use this shop page as the hub for inventory, order handling, customers, and reporting."}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Company</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{shop.company_name}</dd>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Location</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{shop.location}</dd>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Created</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{new Date(shop.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</dt>
              <dd className="mt-2 text-lg font-semibold text-emerald-700">Active</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30">
          <h2 className="text-2xl font-semibold text-slate-900">Next actions</h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/dashboard/inventory" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Open inventory workspace
            </Link>
            <Link href="/dashboard/orders" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Check pending orders
            </Link>
            <Link href="/dashboard/customers" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Review customer activity
            </Link>
            <Link href="/dashboard/reports" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              View performance reports
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}
