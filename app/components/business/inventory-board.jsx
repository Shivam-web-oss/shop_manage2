"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/inventory-board.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { formatMetricValue, hasManualMetricValue } from "@/lib/manual-metrics"
import { useManualMetricsStore } from "./use-manual-metrics-store"

export default function InventoryBoard({ dashboards }) {
  const { metricsStore } = useManualMetricsStore()

  return (
    <section className="ui-card rounded-[32px] p-6">
      <div className="ui-panel mb-5 rounded-2xl p-4 text-sm text-[var(--ink-muted)]">
        Inventory values are user-entered. Open each shop and save data in the manual data section.
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--ink-muted)]">
              <th className="px-4 py-3 font-semibold">Shop</th>
              <th className="px-4 py-3 font-semibold">Tracked Stock</th>
              <th className="px-4 py-3 font-semibold">Low Stock SKUs</th>
              <th className="px-4 py-3 font-semibold">Reorders</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {dashboards.map((shop) => {
              const metrics = metricsStore?.[shop.id] ?? {}
              const stock = hasManualMetricValue(metrics.inventoryTracked)
                ? `${formatMetricValue(metrics.inventoryTracked)} items`
                : "Not set"
              const lowStock = formatMetricValue(metrics.lowStockSkus)
              const reorders = formatMetricValue(metrics.reorders)

              return (
                <tr key={shop.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-4 font-medium text-[var(--foreground)]">{shop.shop_name}</td>
                  <td className="px-4 py-4 text-[var(--ink-muted)]">{stock}</td>
                  <td className="px-4 py-4 text-[var(--ink-muted)]">{lowStock}</td>
                  <td className="px-4 py-4 text-[var(--ink-muted)]">{reorders}</td>
                  <td className="px-4 py-4">
                    <Link href={`/business/shops/${shop.id}#manual-data`} className="ui-btn-secondary px-4 py-2 text-xs">
                      Update data
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
