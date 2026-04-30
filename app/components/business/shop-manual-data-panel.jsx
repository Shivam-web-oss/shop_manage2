"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/shop-manual-data-panel.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useMemo, useState } from "react"
import { formatMetricValue, hasManualMetricValue, saveShopManualMetrics } from "@/lib/manual-metrics"
import { useManualMetricsStore } from "./use-manual-metrics-store"

const EMPTY_METRICS = Object.freeze({})

const FIELD_GROUPS = [
  {
    title: "Inventory",
    fields: [
      { name: "inventoryTracked", label: "Tracked stock", step: "1", min: "0" },
      { name: "lowStockSkus", label: "Low stock SKUs", step: "1", min: "0" },
      { name: "reorders", label: "Reorders", step: "1", min: "0" },
    ],
  },
  {
    title: "Orders",
    fields: [
      { name: "ordersQueued", label: "Queued orders", step: "1", min: "0" },
      { name: "ordersPreparing", label: "Preparing orders", step: "1", min: "0" },
      { name: "ordersDelayed", label: "Delayed orders", step: "1", min: "0" },
    ],
  },
  {
    title: "Customers",
    fields: [
      { name: "monthlyVisits", label: "Monthly visits", step: "1", min: "0" },
      { name: "loyaltyRedemptions", label: "Loyalty redemptions", step: "1", min: "0" },
      { name: "feedbackScore", label: "Feedback score (0-5)", step: "0.1", min: "0", max: "5" },
    ],
  },
  {
    title: "Reports",
    fields: [
      { name: "monthlyRevenue", label: "Monthly revenue", step: "0.01", min: "0" },
      { name: "profitMargin", label: "Profit margin %", step: "0.1", min: "0" },
      { name: "growthRate", label: "Growth %", step: "0.1" },
    ],
  },
  {
    title: "Team",
    fields: [
      { name: "teamMembers", label: "Active staff", step: "1", min: "0" },
      { name: "returningCustomers", label: "Returning customers", step: "1", min: "0" },
    ],
  },
]

function mapMetricsToForm(metrics) {
  return {
    inventoryTracked: hasManualMetricValue(metrics.inventoryTracked) ? String(metrics.inventoryTracked) : "",
    lowStockSkus: hasManualMetricValue(metrics.lowStockSkus) ? String(metrics.lowStockSkus) : "",
    reorders: hasManualMetricValue(metrics.reorders) ? String(metrics.reorders) : "",
    ordersQueued: hasManualMetricValue(metrics.ordersQueued) ? String(metrics.ordersQueued) : "",
    ordersPreparing: hasManualMetricValue(metrics.ordersPreparing) ? String(metrics.ordersPreparing) : "",
    ordersDelayed: hasManualMetricValue(metrics.ordersDelayed) ? String(metrics.ordersDelayed) : "",
    monthlyVisits: hasManualMetricValue(metrics.monthlyVisits) ? String(metrics.monthlyVisits) : "",
    loyaltyRedemptions: hasManualMetricValue(metrics.loyaltyRedemptions) ? String(metrics.loyaltyRedemptions) : "",
    feedbackScore: hasManualMetricValue(metrics.feedbackScore) ? String(metrics.feedbackScore) : "",
    monthlyRevenue: hasManualMetricValue(metrics.monthlyRevenue) ? String(metrics.monthlyRevenue) : "",
    profitMargin: hasManualMetricValue(metrics.profitMargin) ? String(metrics.profitMargin) : "",
    growthRate: hasManualMetricValue(metrics.growthRate) ? String(metrics.growthRate) : "",
    teamMembers: hasManualMetricValue(metrics.teamMembers) ? String(metrics.teamMembers) : "",
    returningCustomers: hasManualMetricValue(metrics.returningCustomers) ? String(metrics.returningCustomers) : "",
  }
}

export default function ShopManualDataPanel({ shopId, shopName }) {
  const { metricsStore, reload } = useManualMetricsStore()
  const metrics = useMemo(() => metricsStore?.[shopId] ?? EMPTY_METRICS, [metricsStore, shopId])
  const [form, setForm] = useState(() => mapMetricsToForm(metrics))
  const [status, setStatus] = useState("")

  const highlights = useMemo(
    () => [
      {
        label: "Inventory Coverage",
        value: hasManualMetricValue(metrics.inventoryTracked)
          ? `${formatMetricValue(metrics.inventoryTracked)} items tracked`
          : "Not set",
      },
      {
        label: "Pending Orders",
        value: hasManualMetricValue(metrics.ordersQueued)
          ? `${formatMetricValue(metrics.ordersQueued)} orders`
          : "Not set",
      },
      {
        label: "Active Staff",
        value: hasManualMetricValue(metrics.teamMembers)
          ? `${formatMetricValue(metrics.teamMembers)} members`
          : "Not set",
      },
      {
        label: "Returning Customers",
        value: hasManualMetricValue(metrics.returningCustomers)
          ? `${formatMetricValue(metrics.returningCustomers)} this month`
          : "Not set",
      },
    ],
    [metrics]
  )

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setStatus("")
  }

  function handleSubmit(event) {
    event.preventDefault()
    saveShopManualMetrics(shopId, form)
    reload()
    setStatus("Manual data saved.")
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.label} className="ui-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">{item.label}</p>
            <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">{item.value}</p>
          </div>
        ))}
      </div>

      <section id="manual-data" className="ui-card rounded-[32px] p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">Manual Data</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Save operational metrics for {shopName}</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Fill only the fields you track. Empty fields stay unset.</p>
          {metrics.updatedAt && (
            <p className="mt-2 text-xs text-[var(--ink-muted)]">Last saved: {new Date(metrics.updatedAt).toLocaleString()}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">{group.title}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.fields.map((field) => (
                  <label key={field.name} className="rounded-2xl border border-[var(--border)] bg-white p-3 text-sm text-[var(--foreground)] shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
                    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">{field.label}</span>
                    <input
                      type="number"
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      className="ui-input px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="ui-btn-primary px-5 py-3 text-sm"
            >
              Save manual data
            </button>
            {status && <p className="text-sm text-emerald-700">{status}</p>}
          </div>
        </form>
      </section>
    </div>
  )
}
