const MANUAL_METRICS_STORAGE_KEY = "shop-manager.manual-metrics.v1"

const METRIC_FIELDS = [
  "inventoryTracked",
  "lowStockSkus",
  "reorders",
  "ordersQueued",
  "ordersPreparing",
  "ordersDelayed",
  "monthlyVisits",
  "loyaltyRedemptions",
  "feedbackScore",
  "monthlyRevenue",
  "profitMargin",
  "growthRate",
  "teamMembers",
  "returningCustomers",
]

function isBrowser() {
  return typeof window !== "undefined"
}

function parseStoredMetrics(rawValue) {
  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeMetricValue(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function normalizeMetricsPatch(patch) {
  const normalizedPatch = {}

  METRIC_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      normalizedPatch[field] = normalizeMetricValue(patch[field])
    }
  })

  return normalizedPatch
}

function writeStore(store) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(MANUAL_METRICS_STORAGE_KEY, JSON.stringify(store))
}

export function getAllManualMetrics() {
  if (!isBrowser()) {
    return {}
  }

  return parseStoredMetrics(window.localStorage.getItem(MANUAL_METRICS_STORAGE_KEY))
}

export function getShopManualMetrics(shopId) {
  const allMetrics = getAllManualMetrics()
  const metrics = allMetrics?.[shopId]
  return metrics && typeof metrics === "object" ? metrics : {}
}

export function saveShopManualMetrics(shopId, patch) {
  const allMetrics = getAllManualMetrics()
  const previousMetrics = allMetrics?.[shopId] ?? {}
  const normalizedPatch = normalizeMetricsPatch(patch)

  const nextMetrics = {
    ...previousMetrics,
    ...normalizedPatch,
    updatedAt: new Date().toISOString(),
  }

  const nextStore = {
    ...allMetrics,
    [shopId]: nextMetrics,
  }

  writeStore(nextStore)

  return nextMetrics
}

export function hasManualMetricValue(value) {
  return typeof value === "number" && Number.isFinite(value)
}

export function formatMetricValue(value, options = {}) {
  const { prefix = "", suffix = "", decimals } = options

  if (!hasManualMetricValue(value)) {
    return "Not set"
  }

  const localeOptions =
    typeof decimals === "number"
      ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      : { maximumFractionDigits: 2 }

  const formatted = value.toLocaleString(undefined, localeOptions)
  return `${prefix}${formatted}${suffix}`
}

export { MANUAL_METRICS_STORAGE_KEY, METRIC_FIELDS }
