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
    <article className="group overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(19,24,24,0.96),rgba(14,18,18,0.96))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-[rgba(201,246,199,0.22)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{companyName}</p>
          <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{shopName}</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{location}</p>
        </div>
        <span className="rounded-full border border-[rgba(201,246,199,0.2)] bg-[rgba(201,246,199,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Active
        </span>
      </div>

      <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(201,246,199,0.35),transparent)]" />
      <p className="mt-5 min-h-[72px] text-sm leading-6 text-[var(--ink-muted)]">
        {description || "No description added for this shop yet. Add one to help your team understand this location faster."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink-muted)]">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/dashboard/shops/${id}`} className="rounded-full bg-[var(--accent)] px-4 py-2 font-medium text-[#08100c] transition hover:bg-[#dbffda]">
          View details
        </Link>
        <Link href="/dashboard/orders" className="rounded-full border border-[var(--border)] px-4 py-2 font-medium text-[var(--foreground)] transition hover:bg-white/5">
          Open orders
        </Link>
        <span className="text-[var(--ink-muted)]">Created {new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  )
}
