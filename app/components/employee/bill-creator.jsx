"use client"

/**
 * BEGINNER NOTES
 * File: app/components/employee/bill-creator.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import BillTemplate from "@/app/components/BillTemplate"
import { useShopScope } from "@/app/components/business/use-shop-scope"
import { calculateBillTotals } from "@/lib/billing"

// GST used for the bill summary and the payload sent to the API.
const GST_PERCENT = 18
// CGST and SGST are shown as half of the full GST rate.
const HALF_GST_PERCENT = GST_PERCENT / 2

// Reuse one formatter so every money value appears in the same INR style.
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Turn any number-like value into a rupee string such as Rs. 1,200.00.
function currency(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

// Keep money math rounded to two decimals.
function roundAmount(value) {
  return Number(Number(value ?? 0).toFixed(2))
}

// Merge the API response with the current screen data so the printable bill has all details it needs.
function normalizeSavedBill(baseBill, context) {
  // `totals` comes from the live cart calculation on the screen.
  const totals = context.totals ?? {}
  const subtotal = roundAmount(totals.subtotal ?? baseBill?.subtotal ?? 0)
  const discountAmount = roundAmount(totals.discount_amount ?? baseBill?.discount_amount ?? 0)
  const taxableAmount = roundAmount(subtotal - discountAmount)
  const gstAmount = roundAmount(totals.gst_amount ?? baseBill?.gst_amount ?? 0)
  const cgstAmount = roundAmount(gstAmount / 2)
  const sgstAmount = roundAmount(gstAmount - cgstAmount)

  return {
    ...(baseBill ?? {}),
    customer_name: String(baseBill?.customer_name ?? context.customerName ?? "").trim() || "Walk-in",
    customer_phone: String(baseBill?.customer_phone ?? context.customerPhone ?? "").trim() || null,
    customer_address: context.customerAddress ?? null,
    company_name: context.shop?.company_name ?? null,
    shop_name: context.shop?.shop_name ?? null,
    shop_location: context.shop?.location ?? null,
    subtotal,
    discount_percent: roundAmount(totals.discount_percent ?? baseBill?.discount_percent ?? 0),
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    gst_amount: gstAmount,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    total_amount: roundAmount(totals.total_amount ?? baseBill?.total_amount ?? 0),
    payment_method: baseBill?.payment_method ?? context.paymentMethod ?? null,
    items: Array.isArray(baseBill?.items) && baseBill.items.length ? baseBill.items : context.items ?? [],
  }
}

export default function BillCreator() {
  // Shop scope tells us which shops the user can work with and which shop is active right now.
  const {
    shops,
    activeShop,
    activeShopId,
    setActiveShopId,
    shopLocked,
    loadingShops,
    shopError,
  } = useShopScope()

  // Full product list for the selected shop.
  const [products, setProducts] = useState([])
  // Search text used to filter products on screen.
  const [search, setSearch] = useState("")
  // Items the employee has added to the current bill.
  const [cart, setCart] = useState([])
  // Customer name typed into the form.
  const [customerName, setCustomerName] = useState("")
  // Customer phone typed into the form.
  const [customerPhone, setCustomerPhone] = useState("")
  // Customer address typed into the form.
  const [customerAddress, setCustomerAddress] = useState("")
  // Percentage discount to apply before tax.
  const [discountPercent, setDiscountPercent] = useState(0)
  // Payment method chosen for the bill.
  const [paymentMethod, setPaymentMethod] = useState("cash")
  // Loading state for the product list.
  const [loading, setLoading] = useState(true)
  // Loading state for the "Create Bill" action.
  const [submitting, setSubmitting] = useState(false)
  // Error message shown to the user when something fails.
  const [error, setError] = useState("")
  // Success/info message shown to the user.
  const [message, setMessage] = useState("")
  // The most recently created bill, used to show the printable preview.
  const [savedBill, setSavedBill] = useState(null)

  // Load products for the currently selected shop.
  const loadProducts = useCallback(async (shopId) => {
    // If no shop is selected yet, clear the product list and stop.
    if (!shopId) {
      setProducts([])
      setLoading(false)
      return
    }

    // Start a fresh loading cycle every time the shop changes.
    setLoading(true)
    setError("")
    try {
      // Ask the products API for the selected shop only.
      const response = await fetch(`/api/products?shopId=${encodeURIComponent(shopId)}`, { cache: "no-store" })
      // If JSON parsing fails, fall back to an empty object so error handling still works.
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Failed to load products.")
      }
      setProducts(Array.isArray(data.products) ? data.products : [])
    } catch (loadError) {
      setError(loadError.message || "Failed to load products.")
    } finally {
      // Loading is finished whether the request succeeded or failed.
      setLoading(false)
    }
  }, [])

  // Whenever the active shop changes, reset the current bill and fetch that shop's products.
  useEffect(() => {
    if (loadingShops) {
      return
    }

    setCart([])
    setSavedBill(null)
    loadProducts(activeShopId)
  }, [activeShopId, loadingShops, loadProducts])

  // Show only products that match the search text, and cap the list to keep the UI manageable.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products.slice(0, 30)

    return products
      .filter((product) => {
        return (
          String(product.name ?? "").toLowerCase().includes(query) ||
          String(product.sku ?? "").toLowerCase().includes(query)
        )
      })
      .slice(0, 30)
  }, [products, search])

  // Add a clicked product to the bill, or increase quantity if it is already in the cart.
  function addItem(product) {
    setCart((previous) => {
      // Check whether this product is already in the current bill.
      const existing = previous.find((item) => item.product_id === product.id)
      if (existing) {
        // Increase quantity, but never go above the available stock.
        return previous.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, Number(product.quantity ?? 0)),
              }
            : item
        )
      }

      // If the product is new to the cart, start it with quantity 1.
      return [
        ...previous,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price ?? 0),
          available: Number(product.quantity ?? 0),
        },
      ]
    })
    setMessage("")
    setError("")
  }

  // Update quantity for one cart line and remove the line if the quantity becomes 0.
  function updateQuantity(productId, nextQty) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                // Clamp the typed value between 0 and the available stock.
                quantity: Math.max(0, Math.min(Number(nextQty) || 0, item.available)),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Allow the employee to override the selling price for a cart line.
  function updatePrice(productId, nextPrice) {
    setCart((previous) =>
      previous.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              unit_price: Math.max(Number(nextPrice) || 0, 0),
            }
          : item
      )
    )
  }

  // Totals are recalculated whenever the cart or discount changes.
  const totals = useMemo(() => calculateBillTotals(cart, discountPercent, GST_PERCENT), [cart, discountPercent])
  // Taxable amount is the subtotal after discount and before GST.
  const taxableAmount = useMemo(() => roundAmount(totals.subtotal - totals.discount_amount), [totals])
  // CGST is half of the full GST amount.
  const cgstAmount = useMemo(() => roundAmount(totals.gst_amount / 2), [totals.gst_amount])
  // SGST is the remaining half of GST.
  const sgstAmount = useMemo(() => roundAmount(totals.gst_amount - cgstAmount), [cgstAmount, totals.gst_amount])

  // Send the bill to the API, save the response, reset the form, and refresh stock.
  async function submitBill() {
    if (!activeShopId) {
      setError("Select a shop before creating a bill.")
      return
    }

    if (!cart.length) {
      setError("Please add at least one item.")
      return
    }

    setSubmitting(true)
    setError("")
    setMessage("")

    // Freeze the current form values so they stay consistent throughout the async request.
    const currentCustomerName = customerName.trim() || "Walk-in"
    const currentCustomerPhone = customerPhone.trim() || null
    const currentCustomerAddress = customerAddress.trim() || null
    // Convert cart items into the structure expected by the bill API.
    const currentItems = cart.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: roundAmount(item.quantity * item.unit_price),
    }))
    // Keep the current shop details so the preview still shows them after the form resets.
    const currentShop = activeShop

    try {
      // Create the bill in the backend.
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: activeShopId,
          customer_name: currentCustomerName,
          customer_phone: currentCustomerPhone,
          customer_address: currentCustomerAddress,
          discount_percent: Number(discountPercent) || 0,
          gst_percent: GST_PERCENT,
          payment_method: paymentMethod,
          items: currentItems.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        }),
      })

      // Read the response body, even when it is an error, so we can show a helpful message.
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to create bill.")
      }

      // Save a normalized bill object so the preview/print template has everything it needs.
      setSavedBill(
        normalizeSavedBill(data.bill ?? null, {
          shop: currentShop,
          customerName: currentCustomerName,
          customerPhone: currentCustomerPhone,
          customerAddress: currentCustomerAddress,
          paymentMethod,
          totals,
          items: currentItems,
        })
      )
      setMessage("Bill created successfully. You can print it below.")

      // Clear the form to prepare for the next bill.
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setDiscountPercent(0)
      setPaymentMethod("cash")

      // Reload products so stock numbers reflect the items we just sold.
      await loadProducts(activeShopId)
    } catch (submitError) {
      setError(submitError.message || "Unable to create bill.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left side: choose shop and products. */}
      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Select Products</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Search and click a product to add it to the bill.</p>

        {/* Shop selector controls which shop's products and stock we are working with. */}
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Shop</span>
            <select
              className="ui-select"
              value={activeShopId}
              onChange={(event) => setActiveShopId(event.target.value)}
              disabled={shopLocked || loadingShops || shops.length === 0}
            >
              {shops.length === 0 ? <option value="">No shop available</option> : null}
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shop_name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm text-[var(--ink-muted)]">
            {activeShop ? `Creating bills for ${activeShop.shop_name}.` : "Pick a shop before adding products."}
          </div>
        </div>

        {/* Product search field. */}
        <input
          className="ui-input mt-4"
          placeholder="Search by product name or SKU"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {shopError ? <p className="mt-4 text-sm text-red-600">{shopError}</p> : null}

        {/* Product list states: no shop, loading, no matches, or the actual clickable grid. */}
        {!loadingShops && shops.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">No shop is available for billing yet.</p>
        ) : loadingShops || loading ? (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">No products found.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addItem(product)}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition hover:border-[var(--accent)]"
              >
                <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                {product.sku ? <p className="mt-1 text-xs text-[var(--ink-muted)]">SKU: {product.sku}</p> : null}
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  {currency(product.price)} | Stock {Number(product.quantity ?? 0)}
                </p>
              </button>
            ))}
          </div>
        )}
      </article>

      {/* Right side: customer form, cart, totals, and submit button. */}
      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Bill Summary</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Review, confirm, and print bill details.</p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        {/* Optional customer details that will be included on the bill. */}
        <div className="mt-4 space-y-2">
          <input
            className="ui-input"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
          <input
            className="ui-input"
            placeholder="Customer phone (optional)"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
          />
          <input
            className="ui-input"
            placeholder="Customer address (optional)"
            value={customerAddress}
            onChange={(event) => setCustomerAddress(event.target.value)}
          />
        </div>

        {/* Cart editor lets the employee adjust quantity and rate for each selected product. */}
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">No items in cart.</p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                <p className="font-medium text-[var(--foreground)]">{item.product_name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    max={item.available}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.product_id, event.target.value)}
                    className="ui-input"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(event) => updatePrice(item.product_id, event.target.value)}
                    className="ui-input"
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  Line total: {currency(item.quantity * item.unit_price)} (available {item.available})
                </p>
              </div>
            ))
          )}
        </div>

        {/* Discount and payment mode controls. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            className="ui-input"
            placeholder="Discount %"
          />
          <select className="ui-select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {/* Live totals preview so the employee can verify the bill before saving it. */}
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency(totals.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Discount</span>
            <span>-{currency(totals.discount_amount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Taxable Amount</span>
            <span>{currency(taxableAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>CGST ({HALF_GST_PERCENT}%)</span>
            <span>{currency(cgstAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>SGST ({HALF_GST_PERCENT}%)</span>
            <span>{currency(sgstAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency(totals.total_amount)}</span>
          </div>
        </div>

        {/* Main submit button for creating the bill in the backend. */}
        <button
          type="button"
          onClick={submitBill}
          disabled={submitting || loadingShops || shops.length === 0}
          className="ui-btn-primary mt-5 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Creating Bill..." : "Create Bill"}
        </button>

        {/* After a successful save, show a short summary above the printable template. */}
        {savedBill ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
            <p className="font-medium text-[var(--foreground)]">Latest bill ready to print</p>
            <p className="mt-1 text-[var(--ink-muted)]">Bill ID: {savedBill.id}</p>
            <p className="text-[var(--ink-muted)]">Customer: {savedBill.customer_name || "Walk-in"}</p>
            <p className="text-[var(--ink-muted)]">Total: {currency(savedBill.total_amount)}</p>
            <p className="text-[var(--ink-muted)]">
              Time: {savedBill.created_at ? new Date(savedBill.created_at).toLocaleString() : "N/A"}
            </p>
          </div>
        ) : null}
      </article>

      {/* Full printable bill preview appears only after a bill has been created successfully. */}
      {savedBill ? (
        <div className="xl:col-span-2">
          <BillTemplate bill={savedBill} />
        </div>
      ) : null}
    </section>
  )
}
