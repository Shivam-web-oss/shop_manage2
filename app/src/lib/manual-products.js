const MANUAL_PRODUCTS_STORAGE_KEY = "shop-manager.manual-products.v1"

function isBrowser() {
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

  window.localStorage.setItem(MANUAL_PRODUCTS_STORAGE_KEY, JSON.stringify(store))
}

function parseNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getAllManualProducts() {
  return readStore()
}

export function getShopManualProducts(shopId) {
  const store = readStore()
  const products = store?.[shopId]
  return Array.isArray(products) ? products : []
}

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
