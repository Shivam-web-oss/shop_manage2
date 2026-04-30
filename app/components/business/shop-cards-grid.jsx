"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/shop-cards-grid.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import ShopCard from "./shop-card"
import { formatMetricValue, hasManualMetricValue } from "@/lib/manual-metrics"
import { useManualMetricsStore } from "./use-manual-metrics-store"

function buildCardMetrics(metrics) {
  return [
    {
      label: "Inventory",
      value: hasManualMetricValue(metrics.inventoryTracked)
        ? `${formatMetricValue(metrics.inventoryTracked)} items`
        : "Not set",
    },
    {
      label: "Orders",
      value: hasManualMetricValue(metrics.ordersQueued)
        ? `${formatMetricValue(metrics.ordersQueued)} queued`
        : "Not set",
    },
    {
      label: "Team",
      value: hasManualMetricValue(metrics.teamMembers)
        ? `${formatMetricValue(metrics.teamMembers)} members`
        : "Not set",
    },
  ]
}

export default function ShopCardsGrid({ dashboards }) {
  const { metricsStore } = useManualMetricsStore()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {dashboards.map((shop) => (
        <ShopCard
          key={shop.id}
          id={shop.id}
          shopName={shop.shop_name}
          companyName={shop.company_name}
          location={shop.location}
          description={shop.description}
          createdAt={shop.created_at}
          metrics={buildCardMetrics(metricsStore?.[shop.id] ?? {})}
        />
      ))}
    </div>
  )
}
