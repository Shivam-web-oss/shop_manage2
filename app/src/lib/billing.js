/**
 * BEGINNER NOTES
 * File: app/src/lib/billing.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

function toNumber(value, fallback = 0) {
  // Normalize unknown input into a safe number for math.
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

// Calculates bill totals (subtotal, discount, GST, total).
// Inputs typically come from the bill-creation UI and the selected cart items.
export function calculateBillTotals(cartItems = [], discountPercent = 0, gstPercent = 18) {
  const subtotal = cartItems.reduce((sum, item) => sum + toNumber(item.unit_price) * toNumber(item.quantity), 0)
  const discount = Math.max(toNumber(discountPercent), 0)
  const taxableAmount = Math.max(subtotal - (subtotal * discount) / 100, 0)
  const gstAmount = (taxableAmount * Math.max(toNumber(gstPercent), 0)) / 100
  const totalAmount = taxableAmount + gstAmount

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_percent: Number(discount.toFixed(2)),
    discount_amount: Number((subtotal - taxableAmount).toFixed(2)),
    gst_amount: Number(gstAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
  }
}

// Normalizes a single cart item (safe strings/numbers).
// Why: prevents NaN/negative quantities and keeps data consistent.
export function normalizeCartItem(item = {}) {
  return {
    product_id: item.product_id,
    product_name: String(item.product_name ?? "").trim(),
    quantity: Math.max(Number.parseInt(String(item.quantity ?? 0), 10) || 0, 0),
    unit_price: Math.max(toNumber(item.unit_price, 0), 0),
  }
}
