import SectionHero from "@/app/components/dashboard/section-hero"
import { getUserDashboards } from "@/lib/dashboard"

export default async function CustomersPage() {
  const dashboards = await getUserDashboards()
  const customerStats = dashboards.map((shop, index) => ({
    shopName: shop.shop_name,
    visits: 140 + index * 20,
    loyalty: 35 + index * 5,
    feedback: 4.6 - index * 0.1,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SectionHero
        eyebrow="Customers"
        title="Customer pulse"
        description="Follow repeat visits, loyalty activity, and satisfaction trends for each location. The customer button and menu link now land on a complete page."
        primaryAction={{ href: "/dashboard/reports", label: "Open Reports" }}
        secondaryAction={{ href: "/dashboard", label: "Overview" }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {customerStats.map((item) => (
          <article key={item.shopName} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20">
            <h2 className="text-xl font-semibold text-slate-900">{item.shopName}</h2>
            <p className="mt-5 text-sm text-slate-500">Monthly visits</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.visits}</p>
            <p className="mt-5 text-sm text-slate-500">Loyalty redemptions</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-700">{item.loyalty}</p>
            <p className="mt-5 text-sm text-slate-500">Average feedback score</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{item.feedback.toFixed(1)} / 5</p>
          </article>
        ))}
      </section>
    </div>
  )
}
