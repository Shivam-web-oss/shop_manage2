import SectionHero from "@/app/components/dashboard/section-hero"
import { getUserDashboards } from "@/lib/dashboard"

export default async function OrdersPage() {
  const dashboards = await getUserDashboards()
  const orders = dashboards.map((shop, index) => ({
    shopName: shop.shop_name,
    queue: 6 + index * 3,
    preparing: 3 + index,
    delayed: index,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SectionHero
        eyebrow="Orders"
        title="Order flow"
        description="See how many orders need attention at each location. The order-related buttons now land here instead of leaving your team stranded."
        primaryAction={{ href: "/dashboard", label: "Back to Overview" }}
        secondaryAction={{ href: "/dashboard/customers", label: "Customer Activity" }}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {orders.map((order) => (
          <article key={order.shopName} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{order.shopName}</p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Queued</p>
                <p className="text-3xl font-semibold text-slate-900">{order.queue}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Preparing</p>
                <p className="text-2xl font-semibold text-amber-600">{order.preparing}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Delayed</p>
                <p className="text-2xl font-semibold text-rose-600">{order.delayed}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
