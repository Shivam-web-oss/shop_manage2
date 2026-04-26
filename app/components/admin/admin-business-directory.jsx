"use client"

import { useMemo, useState } from "react"

function formatDateTime(value) {
  if (!value) return "Unknown date"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function AdminBusinessDirectory({ businesses }) {
  const [query, setQuery] = useState("")

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return businesses

    return businesses.filter((business) => {
      return [
        business.shop_name,
        business.company_name,
        business.location,
        business.owner_name,
        business.owner_email,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery))
    })
  }, [businesses, query])

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-eyebrow">Admin Panel</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">Business Directory</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)]">
              Open this panel to review every business account stored in the database in one clean dashboard list.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 font-semibold text-[var(--foreground)]">
              {businesses.length} business(es)
            </div>
            <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 font-semibold text-[var(--foreground)]">
              {filteredBusinesses.length} shown
            </div>
          </div>
        </div>
      </section>

      <section className="ui-card rounded-[2rem] p-6 sm:p-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--border)] bg-white/95 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">Businesses</h2>
            <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-deep)]">
              Live Database
            </div>
          </div>

          <div className="mt-5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search businesses..."
              className="ui-input max-w-sm"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--foreground)]">
                  <th className="px-4 py-4 font-semibold">Business</th>
                  <th className="px-4 py-4 font-semibold">Active</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Items</th>
                  <th className="px-4 py-4 font-semibold">Created</th>
                  <th className="px-4 py-4 font-semibold">Owner</th>
                  <th className="px-4 py-4 font-semibold">Business ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-[var(--ink-muted)]">
                      No businesses matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => (
                    <tr key={business.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--foreground)]">{business.shop_name}</p>
                        <p className="mt-1 text-[var(--ink-muted)]">{business.company_name}</p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">{business.location}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-7 w-12 items-center rounded-full bg-[#1d7cf2] p-1">
                          <span className="ml-auto h-5 w-5 rounded-full bg-white shadow-sm" />
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[var(--foreground)]">{business.status}</td>
                      <td className="px-4 py-4 text-[var(--foreground)]">{business.product_count}</td>
                      <td className="px-4 py-4 text-[var(--foreground)]">{formatDateTime(business.created_at)}</td>
                      <td className="px-4 py-4">
                        <p className="text-[var(--foreground)]">{business.owner_name}</p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">{business.owner_email}</p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-[var(--ink-muted)]">{business.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  )
}
