"use client"

import Link from "next/link"
import { formatMetricValue } from "@/lib/manual-metrics"
import { useManualMetricsStore } from "./use-manual-metrics-store"

export default function CustomersBoard({ dashboards }) {
  const { metricsStore } = useManualMetricsStore()

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {dashboards.map((shop) => {
        const metrics = metricsStore?.[shop.id] ?? {}

        return (
          <article key={shop.id} className="ui-card rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{shop.shop_name}</h2>
            <p className="mt-5 text-sm text-[var(--ink-muted)]">Monthly visits</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{formatMetricValue(metrics.monthlyVisits)}</p>
            <p className="mt-5 text-sm text-[var(--ink-muted)]">Loyalty redemptions</p>
            <p className="mt-2 text-2xl font-semibold text-sky-700">{formatMetricValue(metrics.loyaltyRedemptions)}</p>
            <p className="mt-5 text-sm text-[var(--ink-muted)]">Average feedback score</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatMetricValue(metrics.feedbackScore, { suffix: " / 5", decimals: 1 })}</p>
            <Link
              href={`/business/shops/${shop.id}#manual-data`}
              className="ui-btn-secondary mt-6 px-4 py-2 text-xs"
            >
              Update data
            </Link>
          </article>
        )
      })}
    </section>
  )
}
