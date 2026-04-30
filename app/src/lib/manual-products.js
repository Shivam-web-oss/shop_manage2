/**
 * BEGINNER NOTES
 * File: app/src/lib/manual-products.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

const MANUAL_PRODUCTS_STORAGE_KEY = "shop-manager.manual-products.v1"

function isBrowser() {
  // Next.js can run code on the server; only the browser has `window/localStorage`.
  return typeof window !== "undefined"
}

function readStore() {
  if (!isBrowser()) {
    return {}
  }

  const rawValue = window.localStorage.getItem(MANUAL_PRODUCTS_STORAGE_KEY)
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

function writeStore(store) {
  if (!isBrowser()) {
    return
  }

  // Persist the whole store in the browser using localStorage.
  window.localStorage.setItem(MANUAL_PRODUCTS_STORAGE_KEY, JSON.stringify(store))
}

function parseNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function createId() {
  // Use a real UUID if available; otherwise fall back to a timestamp-based id.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Returns all manually-entered products for all shops (browser storage).
export function getAllManualProducts() {
  return readStore()
}

// Returns manually-entered products for one shop id.
export function getShopManualProducts(shopId) {
  const store = readStore()
  const products = store?.[shopId]
  return Array.isArray(products) ? products : []
}

// Adds one "manual product" to a shop (client-side only).
export function addShopManualProduct(shopId, payload) {
  const store = readStore()
  const previousProducts = Array.isArray(store?.[shopId]) ? store[shopId] : []

  const nextProduct = {
    id: createId(),
    name: String(payload.name || "").trim(),
    price: parseNumber(payload.price),
    stock: parseNumber(payload.stock),
    createdAt: new Date().toISOString(),
  }

  const nextStore = {
    ...store,
    [shopId]: [nextProduct, ...previousProducts],
  }

  writeStore(nextStore)
  return nextStore
}

// Removes a manual product from a shop by id.
export function removeShopManualProduct(shopId, productId) {
  const store = readStore()
  const previousProducts = Array.isArray(store?.[shopId]) ? store[shopId] : []
  const nextProducts = previousProducts.filter((product) => product.id !== productId)

  const nextStore = {
    ...store,
    [shopId]: nextProducts,
  }

  writeStore(nextStore)
  return nextStore
}

export { MANUAL_PRODUCTS_STORAGE_KEY }
