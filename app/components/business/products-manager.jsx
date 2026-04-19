"use client"

import { useEffect, useMemo, useState } from "react"

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  unit: "pcs",
  price: "",
  quantity: "",
}

function toCurrency(value) {
  return `₹${Number(value ?? 0).toFixed(2)}`
}

function toNumberInput(value) {
  if (value === null || value === undefined) return ""
  return String(value)
}

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [drafts, setDrafts] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
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

      const rows = Array.isArray(data.products) ? data.products : []
      setProducts(rows)
      setDrafts(
        rows.reduce((acc, row) => {
          acc[row.id] = {
            name: row.name ?? "",
            sku: row.sku ?? "",
            category: row.category ?? "",
            unit: row.unit ?? "pcs",
            price: toNumberInput(row.price),
            quantity: toNumberInput(row.quantity),
          }
          return acc
        }, {})
      )
    } catch (loadError) {
      setError(loadError.message || "Unable to fetch products.")
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

  async function handleCreateProduct(event) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!form.name.trim()) {
      setError("Product name is required.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          sku: form.sku.trim(),
          category: form.category.trim(),
          unit: form.unit.trim() || "pcs",
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to create product.")
      }

      setForm(EMPTY_FORM)
      setMessage("Product created successfully.")
      await loadProducts()
    } catch (saveError) {
      setError(saveError.message || "Unable to create product.")
    } finally {
      setSaving(false)
    }
  }

  function updateDraft(productId, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...previous[productId],
        [field]: value,
      },
    }))
    setMessage("")
    setError("")
  }

  async function saveDraft(productId) {
    setError("")
    setMessage("")
    const draft = drafts[productId]
    if (!draft?.name?.trim()) {
      setError("Product name cannot be empty.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          sku: draft.sku.trim(),
          category: draft.category.trim(),
          unit: draft.unit.trim() || "pcs",
          price: draft.price,
          quantity: draft.quantity,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to update product.")
      }

      setMessage("Product updated.")
      await loadProducts()
    } catch (saveError) {
      setError(saveError.message || "Unable to update product.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(productId) {
    const confirmed = window.confirm("Delete this product permanently?")
    if (!confirmed) return

    setError("")
    setMessage("")
    setSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete product.")
      }

      setMessage("Product deleted.")
      await loadProducts()
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete product.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Add New Product</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Fill in basic details and click save. You can edit or delete it anytime below.
        </p>

        <form onSubmit={handleCreateProduct} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="name"
            placeholder="Product name"
            className="ui-input"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            required
          />
          <input
            name="sku"
            placeholder="SKU (optional)"
            className="ui-input"
            value={form.sku}
            onChange={(event) => setForm((previous) => ({ ...previous, sku: event.target.value }))}
          />
          <input
            name="category"
            placeholder="Category"
            className="ui-input"
            value={form.category}
            onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
          />
          <input
            name="unit"
            placeholder="Unit (pcs/kg/litre)"
            className="ui-input"
            value={form.unit}
            onChange={(event) => setForm((previous) => ({ ...previous, unit: event.target.value }))}
          />
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            className="ui-input"
            value={form.price}
            onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))}
          />
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            placeholder="Initial quantity"
            className="ui-input"
            value={form.quantity}
            onChange={(event) => setForm((previous) => ({ ...previous, quantity: event.target.value }))}
          />
          <button
            type="submit"
            disabled={saving}
            className="ui-btn-primary px-5 py-3 text-sm md:col-span-2 xl:col-span-3 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </form>
      </article>

      <article className="ui-card rounded-3xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Manage Products</h2>
            <p className="text-sm text-[var(--ink-muted)]">Edit any field and click update to save.</p>
          </div>
          <input
            className="ui-input w-full sm:max-w-xs"
            placeholder="Search by name, SKU, category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        {loading ? (
          <p className="mt-6 text-sm text-[var(--ink-muted)]">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--ink-muted)]">No products found.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredProducts.map((product) => {
              const draft = drafts[product.id] ?? {}
              return (
                <div key={product.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <input
                      className="ui-input xl:col-span-2"
                      value={draft.name ?? ""}
                      onChange={(event) => updateDraft(product.id, "name", event.target.value)}
                      placeholder="Name"
                    />
                    <input
                      className="ui-input"
                      value={draft.sku ?? ""}
                      onChange={(event) => updateDraft(product.id, "sku", event.target.value)}
                      placeholder="SKU"
                    />
                    <input
                      className="ui-input"
                      value={draft.category ?? ""}
                      onChange={(event) => updateDraft(product.id, "category", event.target.value)}
                      placeholder="Category"
                    />
                    <input
                      className="ui-input"
                      value={draft.unit ?? ""}
                      onChange={(event) => updateDraft(product.id, "unit", event.target.value)}
                      placeholder="Unit"
                    />
                    <input
                      type="number"
                      className="ui-input"
                      value={draft.price ?? ""}
                      min="0"
                      step="0.01"
                      onChange={(event) => updateDraft(product.id, "price", event.target.value)}
                      placeholder="Price"
                    />
                    <input
                      type="number"
                      className="ui-input"
                      value={draft.quantity ?? ""}
                      min="0"
                      step="1"
                      onChange={(event) => updateDraft(product.id, "quantity", event.target.value)}
                      placeholder="Quantity"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[var(--ink-muted)]">
                      Current: {toCurrency(product.price)} • Qty {Number(product.quantity ?? 0)} • Updated{" "}
                      {product.updated_at ? new Date(product.updated_at).toLocaleString() : "N/A"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveDraft(product.id)}
                        className="ui-btn-primary px-4 py-2 text-xs"
                        disabled={saving}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="ui-btn-secondary px-4 py-2 text-xs text-red-700"
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </article>
    </section>
  )
}
