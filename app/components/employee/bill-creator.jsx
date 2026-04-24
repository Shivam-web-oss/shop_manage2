"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useShopScope } from "@/app/components/business/use-shop-scope"

function currency(value) {
  return `â‚¹${Number(value ?? 0).toFixed(2)}`
}

export default function BillCreator() {
  const {
    shops,
    activeShop,
    activeShopId,
    setActiveShopId,
    shopLocked,
    loadingShops,
    shopError,
  } = useShopScope()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [discountPercent, setDiscountPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [savedBill, setSavedBill] = useState(null)

  const loadProducts = useCallback(async (shopId) => {
    if (!shopId) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/products?shopId=${encodeURIComponent(shopId)}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Failed to load products.")
      }
      setProducts(Array.isArray(data.products) ? data.products : [])
    } catch (loadError) {
      setError(loadError.message || "Failed to load products.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadingShops) {
      return
    }

    setCart([])
    loadProducts(activeShopId)
  }, [activeShopId, loadingShops, loadProducts])

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

  function addItem(product) {
    setCart((previous) => {
      const existing = previous.find((item) => item.product_id === product.id)
      if (existing) {
        return previous.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, Number(product.quantity ?? 0)),
              }
            : item
        )
      }

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

  function updateQuantity(productId, nextQty) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: Math.max(0, Math.min(Number(nextQty) || 0, item.available)),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

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

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    const discount = Math.max(Number(discountPercent) || 0, 0)
    return (subtotal * discount) / 100
  }, [discountPercent, subtotal])

  const taxable = Math.max(subtotal - discountAmount, 0)
  const gstAmount = taxable * 0.18
  const grandTotal = taxable + gstAmount

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

    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: activeShopId,
          customer_name: customerName.trim() || "Walk-in",
          customer_phone: customerPhone.trim() || null,
          discount_percent: Number(discountPercent) || 0,
          payment_method: paymentMethod,
          items: cart.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to create bill.")
      }

      setSavedBill(data.bill ?? null)
      setMessage("Bill created successfully.")
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setDiscountPercent(0)
      setPaymentMethod("cash")
      await loadProducts(activeShopId)
    } catch (submitError) {
      setError(submitError.message || "Unable to create bill.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Select Products</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Search and click a product to add it to the bill.</p>

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

        <input
          className="ui-input mt-4"
          placeholder="Search by product name or SKU"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {shopError ? <p className="mt-4 text-sm text-red-600">{shopError}</p> : null}

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
                <p className="mt-1 text-xs text-[var(--ink-muted)]">SKU: {product.sku || "N/A"}</p>
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  {currency(product.price)} â€¢ Stock {Number(product.quantity ?? 0)}
                </p>
              </button>
            ))}
          </div>
        )}
      </article>

      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Bill Summary</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Review and confirm bill details.</p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

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
        </div>

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

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Discount</span>
            <span>-{currency(discountAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>GST (18%)</span>
            <span>{currency(gstAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency(grandTotal)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={submitBill}
          disabled={submitting || loadingShops || shops.length === 0}
          className="ui-btn-primary mt-5 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Creating Bill..." : "Create Bill"}
        </button>

        {savedBill ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
            <p className="font-medium text-[var(--foreground)]">Last bill saved</p>
            <p className="mt-1 text-[var(--ink-muted)]">Bill ID: {savedBill.id}</p>
            <p className="text-[var(--ink-muted)]">Total: {currency(savedBill.total_amount)}</p>
            <p className="text-[var(--ink-muted)]">
              Time: {savedBill.created_at ? new Date(savedBill.created_at).toLocaleString() : "N/A"}
            </p>
          </div>
        ) : null}
      </article>
    </section>
  )
}
