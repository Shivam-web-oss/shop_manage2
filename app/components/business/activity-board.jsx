"use client"

import { useCallback, useEffect, useState } from "react"

function currency(value) {
  return `₹${Number(value ?? 0).toFixed(2)}`
}

export default function ActivityBoard({ limit = 20, compact = false }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/dashboard/activity?limit=${limit}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.message || "Unable to load dashboard activity.")
      }
      setData(payload)
    } catch (loadError) {
      setError(loadError.message || "Unable to load dashboard activity.")
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading activity...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  const metrics = data?.metrics ?? {}
  const activities = Array.isArray(data?.activities) ? data.activities : []
  const latestBills = Array.isArray(data?.latest_bills) ? data.latest_bills.slice(0, compact ? 5 : 10) : []

  return (
    <section className="space-y-6">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-6"}`}>
        <MetricCard label="Shops" value={metrics.shops_count ?? 0} />
        <MetricCard label="Products" value={metrics.products_count ?? 0} />
        <MetricCard label="Staff" value={metrics.staff_count ?? 0} />
        <MetricCard label="Bills Today" value={metrics.bills_today ?? 0} />
        <MetricCard label="Revenue Today" value={currency(metrics.revenue_today ?? 0)} />
        <MetricCard label="Low Stock" value={metrics.low_stock_count ?? 0} />
      </div>

      <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-2"}`}>
        <article className="ui-card rounded-3xl p-5">
          <h3 className="text-xl font-semibold text-[var(--foreground)]">Recent Activity</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Latest bills and stock changes.</p>
          <div className="mt-4 space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">No activity yet.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                  <p className="font-medium text-[var(--foreground)]">{activity.title}</p>
                  <p className="text-sm text-[var(--ink-muted)]">{activity.description}</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        {!compact ? (
          <article className="ui-card rounded-3xl p-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Latest Bills</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Monitor real billing activity from your team.</p>
            <div className="mt-4 space-y-3">
              {latestBills.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No bills yet.</p>
              ) : (
                latestBills.map((bill) => (
                  <div key={bill.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--foreground)]">{bill.customer_name || "Walk-in"}</p>
                      <p className="font-semibold text-[var(--foreground)]">{currency(bill.total_amount)}</p>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">Payment: {bill.payment_method || "cash"}</p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {bill.created_at ? new Date(bill.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="ui-card rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  )
}
