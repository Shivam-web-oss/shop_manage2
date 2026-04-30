"use client"

/**
 * BEGINNER NOTES
 * File: app/components/admin/admin-business-directory.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useMemo, useState } from "react"

// Helper: format a date string into something readable for admins.
// Input source: `business.created_at` coming from Supabase (`business` table).
// Why: raw timestamps are hard to read; we show a friendly date+time.
function formatDateTime(value) {
  // If the value is missing, show a clear fallback instead of crashing.
  if (!value) return "Unknown date"

  // `Intl.DateTimeFormat` formats a JS `Date` into a locale-specific string.
  // Locale choice here is `en-IN` (India English) to match dd/mm/yyyy style.
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

// UI component: Admin table for browsing businesses.
// Data source: The `businesses` prop is created on the server in `app/admin/page.jsx`
// by calling `getAdminBusinessDirectory` (see `app/src/lib/admin.js`).
export default function AdminBusinessDirectory({ businesses }) {
  // Local UI state: what the admin has typed into the search box.
  const [query, setQuery] = useState("")

  // Derived data: filter `businesses` based on the search query.
  // Why `useMemo`: avoids re-filtering on every render when inputs haven't changed.
  const filteredBusinesses = useMemo(() => {
    // Normalize user input so searching is forgiving:
    // - `trim()` removes extra spaces at the ends
    // - `toLowerCase()` makes searching case-insensitive
    const normalizedQuery = query.trim().toLowerCase()

    // If search is empty, show everything (no filtering).
    if (!normalizedQuery) return businesses

    // Keep only businesses where ANY searchable field contains the query.
    return businesses.filter((business) => {
      // These fields come from:
      // - `business` table: `shop_name`, `company_name`, `location`
      // - `profiles` table (via join logic in `getAdminBusinessDirectory`): `owner_name`, `owner_email`
      return [
        business.shop_name,
        business.company_name,
        business.location,
        business.owner_name,
        business.owner_email,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery))
    })
    // Recompute only when the raw list or query changes.
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
              {/* Total businesses received from the server (not filtered). */}
              {businesses.length} business(es)
            </div>
            <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 font-semibold text-[var(--foreground)]">
              {/* Count after applying the search filter. */}
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
              // Controlled input: `value` comes from React state, and updates via `onChange`.
              value={query}
              // `event.target.value` is what the user typed; we store it in `query` state.
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
                    // `business.id` is the primary key from the `business` table (Supabase).
                    <tr key={business.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                      <td className="px-4 py-4">
                        {/* From `business` table */}
                        <p className="font-semibold text-[var(--foreground)]">{business.shop_name}</p>
                        <p className="mt-1 text-[var(--ink-muted)]">{business.company_name}</p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">{business.location}</p>
                      </td>
                      <td className="px-4 py-4">
                        {/* UI-only indicator (currently always ON). Replace with real DB state if available. */}
                        <span className="inline-flex h-7 w-12 items-center rounded-full bg-[#1d7cf2] p-1">
                          <span className="ml-auto h-5 w-5 rounded-full bg-white shadow-sm" />
                        </span>
                      </td>
                      {/* Currently `status` is set in `getAdminBusinessDirectory` (placeholder: "Active"). */}
                      <td className="px-4 py-4 text-[var(--foreground)]">{business.status}</td>
                      {/* `product_count` is computed in `getAdminBusinessDirectory` using `products` rows. */}
                      <td className="px-4 py-4 text-[var(--foreground)]">{business.product_count}</td>
                      {/* `created_at` comes from the `business` table; formatted for readability. */}
                      <td className="px-4 py-4 text-[var(--foreground)]">{formatDateTime(business.created_at)}</td>
                      <td className="px-4 py-4">
                        {/* `owner_name` + `owner_email` come from `profiles` (via `getAdminBusinessDirectory`). */}
                        <p className="text-[var(--foreground)]">{business.owner_name}</p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">{business.owner_email}</p>
                      </td>
                      {/* Display the raw ID in monospace to help copy/paste. */}
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
