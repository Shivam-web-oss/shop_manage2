"use client"

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
