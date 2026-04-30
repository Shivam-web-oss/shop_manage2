"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/use-manual-metrics-store.js
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useCallback, useEffect, useState } from "react"
import { MANUAL_METRICS_STORAGE_KEY, getAllManualMetrics } from "@/lib/manual-metrics"

export function useManualMetricsStore() {
  const [metricsStore, setMetricsStore] = useState(() => getAllManualMetrics())

  const reload = useCallback(() => {
    setMetricsStore(getAllManualMetrics())
  }, [])

  useEffect(() => {
    function onStorage(event) {
      if (!event.key || event.key === MANUAL_METRICS_STORAGE_KEY) {
        reload()
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [reload])

  return { metricsStore, reload }
}
