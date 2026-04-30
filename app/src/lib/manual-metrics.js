/**
 * BEGINNER NOTES
 * File: app/src/lib/manual-metrics.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

const MANUAL_METRICS_STORAGE_KEY = "shop-manager.manual-metrics.v1"

// List of supported metric fields stored per shop in the browser.
// Why: locking the list prevents random/unexpected keys from being saved.
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
  // Next.js can render code on the server; `window` only exists in the browser.
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
  // Convert empty/invalid inputs to `null` (meaning: not set).
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function normalizeMetricsPatch(patch) {
  const normalizedPatch = {}

  // Only copy known fields from the patch.
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

  // Store as JSON in localStorage (browser-only persistence).
  window.localStorage.setItem(MANUAL_METRICS_STORAGE_KEY, JSON.stringify(store))
}

// Returns all manual metrics for all shops from browser storage.
export function getAllManualMetrics() {
  if (!isBrowser()) {
    return {}
  }

  return parseStoredMetrics(window.localStorage.getItem(MANUAL_METRICS_STORAGE_KEY))
}

// Returns the manual metrics object for a single shop.
export function getShopManualMetrics(shopId) {
  const allMetrics = getAllManualMetrics()
  const metrics = allMetrics?.[shopId]
  return metrics && typeof metrics === "object" ? metrics : {}
}

// Saves/updates manual metrics for a single shop.
// Why: some dashboard numbers may be entered manually if they aren't in the DB.
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

// Formats a metric value into human-readable text (with optional prefix/suffix).
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
