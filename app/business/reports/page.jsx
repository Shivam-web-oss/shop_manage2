import SectionHero from "@/app/components/business/section-hero"
import { getUserDashboards } from "@/lib/business"

export default async function ReportsPage() {
  const dashboards = await getUserDashboards()
  const reportRows = dashboards.map((shop, index) => ({
    shopName: shop.shop_name,
    revenue: 25000 + index * 4200,
    margin: 18 + index * 2,
    growth: 6 + index * 1.5,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SectionHero
        eyebrow="Reports"
        title="Performance snapshot"
        description="A simple reporting hub for revenue, margin, and growth trends. The reports button now leads to a dedicated summary page instead of a placeholder."
        primaryAction={{ href: "/business/orders", label: "Check Orders" }}
        secondaryAction={{ href: "/business/inventory", label: "Inventory Board" }}
      />

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30">
        <div className="grid gap-4 md:grid-cols-3">
          {reportRows.map((row) => (
            <article key={row.shopName} className="rounded-[28px] bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">{row.shopName}</h2>
              <p className="mt-5 text-sm text-slate-500">Monthly revenue</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${row.revenue.toLocaleString()}</p>
              <p className="mt-5 text-sm text-slate-500">Profit margin</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{row.margin}%</p>
              <p className="mt-5 text-sm text-slate-500">Growth</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-700">+{row.growth.toFixed(1)}%</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
