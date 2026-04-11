import Link from "next/link"

type ShopMetric = {
  label: string
  value: string
}

type ShopCardProps = {
  id: string
  shopName: string
  companyName: string
  location: string
  description: string | null
  createdAt: string
  metrics: ShopMetric[]
}

export default function ShopCard({
  id,
  shopName,
  companyName,
  location,
  description,
  createdAt,
  metrics,
}: ShopCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">{companyName}</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">{shopName}</h3>
          <p className="mt-2 text-sm text-slate-600">{location}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Active
        </span>
      </div>

      <p className="mt-5 min-h-[72px] text-sm leading-6 text-slate-600">
        {description || "No description added for this shop yet. Add one to help your team understand this location faster."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/dashboard/shops/${id}`} className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
          View details
        </Link>
        <Link href="/dashboard/orders" className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
          Open orders
        </Link>
        <span className="text-slate-500">Created {new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  )
}
