"use client"

import { useEffect, useMemo, useState } from "react"

export default function StockAdjuster({ title = "Update Stock", subtitle = "Change quantity quickly for any product." }) {
  const [products, setProducts] = useState([])
  const [deltaMap, setDeltaMap] = useState({})
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function loadProducts() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/products", { cache: "no-store" })
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
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      return (
        String(product.name ?? "").toLowerCase().includes(query) ||
        String(product.sku ?? "").toLowerCase().includes(query) ||
        String(product.category ?? "").toLowerCase().includes(query)
      )
    })
  }, [products, search])

  function setDelta(productId, value) {
    const parsed = Number.parseInt(value, 10)
    setDeltaMap((previous) => ({
      ...previous,
      [productId]: Number.isFinite(parsed) ? parsed : 0,
    }))
    setError("")
    setMessage("")
  }

  const pendingEntries = useMemo(() => {
    return Object.entries(deltaMap)
      .map(([id, value]) => [id, Number(value)])
      .filter((entry) => Number.isFinite(entry[1]) && entry[1] !== 0)
  }, [deltaMap])

  async function saveAdjustments() {
    if (!pendingEntries.length) {
      setError("Please enter at least one quantity change.")
      return
    }

    setSaving(true)
    setError("")
    setMessage("")

    try {
      for (const [productId, quantityDelta] of pendingEntries) {
        const response = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity_delta: quantityDelta }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.message || "Unable to update stock quantity.")
        }
      }

      setMessage(`Stock updated for ${pendingEntries.length} product(s).`)
      setDeltaMap({})
      await loadProducts()
    } catch (saveError) {
      setError(saveError.message || "Unable to save stock updates.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="ui-card rounded-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="text-sm text-[var(--ink-muted)]">{subtitle}</p>
        </div>
        <input
          className="ui-input w-full sm:max-w-xs"
          placeholder="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--ink-muted)]">Loading products...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">No products found.</p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 md:grid-cols-[2fr_1fr_1fr]"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    SKU: {product.sku || "N/A"} • Category: {product.category || "N/A"}
                  </p>
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">Current Qty</p>
                  <p className="mt-1 font-semibold">{Number(product.quantity ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">Change (+/-)</p>
                  <input
                    type="number"
                    step="1"
                    className="ui-input mt-1"
                    value={deltaMap[product.id] ?? ""}
                    onChange={(event) => setDelta(product.id, event.target.value)}
                    placeholder="e.g. 5 or -2"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveAdjustments}
          className="ui-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saving}
        >
          {saving ? "Saving..." : `Save ${pendingEntries.length} Change${pendingEntries.length === 1 ? "" : "s"}`}
        </button>
        <p className="text-xs text-[var(--ink-muted)]">Use positive numbers to add stock, negative numbers to reduce stock.</p>
      </div>
    </section>
  )
}
