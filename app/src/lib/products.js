/**
 * BEGINNER NOTES
 * File: app/src/lib/products.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

function sanitizeNumber(value, fallback = 0) {
  // Convert unknown input into a safe number for calculations/storage.
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function sanitizeInteger(value, fallback = 0) {
  // Convert unknown input into a safe integer (whole number).
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Converts a loose UI payload into a consistent product shape for the DB.
// Why: forms often send strings; we normalize types and defaults here.
export function normalizeProductPayload(payload = {}) {
  const quantity = sanitizeInteger(payload.quantity ?? payload.stock, 0)

  return {
    name: String(payload.name ?? "").trim(),
    sku: String(payload.sku ?? "").trim() || null,
    category: String(payload.category ?? "").trim() || null,
    unit: String(payload.unit ?? "").trim() || "pcs",
    price: sanitizeNumber(payload.price, 0),
    quantity,
    stock: quantity,
  }
}

// Adds stock to a product.
// Data source: Supabase `products` table.
// Implementation detail: tries a Postgres RPC first (`increment_stock`), then falls back to a manual update.
export async function incrementStock(supabase, productId, addQty) {
  const qty = sanitizeInteger(addQty, 0)
  if (!qty) {
    return { ok: true }
  }

  const { error: rpcError } = await supabase.rpc("increment_stock", {
    product_id: productId,
    add_qty: qty,
  })

  if (!rpcError) {
    return { ok: true }
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock, quantity")
    .eq("id", productId)
    .maybeSingle()

  if (productError) {
    return { ok: false, error: productError.message }
  }

  const currentQty = sanitizeInteger(product?.quantity ?? product?.stock, 0)
  const { error: updateError } = await supabase
    .from("products")
    .update({
      stock: currentQty + qty,
      quantity: currentQty + qty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  return updateError ? { ok: false, error: updateError.message } : { ok: true }
}

// Removes stock from a product (never below zero).
// Data source: Supabase `products` table.
// Implementation detail: tries a Postgres RPC first (`decrement_stock`), then falls back to a manual update.
export async function decrementStock(supabase, productId, removeQty) {
  const qty = sanitizeInteger(removeQty, 0)
  if (!qty) {
    return { ok: true }
  }

  const { error: rpcError } = await supabase.rpc("decrement_stock", {
    product_id: productId,
    remove_qty: qty,
  })

  if (!rpcError) {
    return { ok: true }
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock, quantity")
    .eq("id", productId)
    .maybeSingle()

  if (productError) {
    return { ok: false, error: productError.message }
  }

  const currentQty = sanitizeInteger(product?.quantity ?? product?.stock, 0)
  const nextQty = Math.max(currentQty - qty, 0)
  const { error: updateError } = await supabase
    .from("products")
    .update({
      stock: nextQty,
      quantity: nextQty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  return updateError ? { ok: false, error: updateError.message } : { ok: true }
}

// UI helper: ensure an input is a positive integer.
export function toPositiveInteger(value) {
  const parsed = sanitizeInteger(value, 0)
  return parsed > 0 ? parsed : 0
}
