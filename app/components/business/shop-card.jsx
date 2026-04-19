"use client"

import Link from "next/link"

export default function ShopCard({
  id,
  shopName,
  companyName,
  location,
  description,
  createdAt,
  metrics,
}) {
  return (
    <article className="group overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff,#f9fbff)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-[rgba(47,158,107,0.3)] hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">{companyName}</p>
          <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{shopName}</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{location}</p>
        </div>
        <span className="rounded-full border border-[rgba(47,158,107,0.24)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
          Active
        </span>
      </div>

      <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(148,163,184,0.45),transparent)]" />
      <p className="mt-5 min-h-[72px] text-sm leading-6 text-[var(--ink-muted)]">
        {description || "No description added for this shop yet. Add one to help your team understand this location faster."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink-muted)]">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/business/shops/${id}`} className="ui-btn-primary px-4 py-2 text-sm">
          View details
        </Link>
        <Link href={`/business/shops/${id}#manual-data`} className="ui-btn-secondary px-4 py-2 text-sm">
          Update manual data
        </Link>
        <span className="text-[var(--ink-muted)]">Created {new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </article>
  )
}
