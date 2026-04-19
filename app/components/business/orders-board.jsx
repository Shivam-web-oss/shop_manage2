"use client"

import { useMemo, useState } from "react"
import { addShopManualProduct, getAllManualProducts, removeShopManualProduct } from "@/lib/manual-products"

const EMPTY_FORM = {
  name: "",
  price: "",
  stock: "",
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function OrdersBoard({ dashboards }) {
  const defaultShopId = dashboards[0]?.id ?? ""
  const [selectedShopId, setSelectedShopId] = useState(defaultShopId)
  const [productsStore, setProductsStore] = useState(() => getAllManualProducts())
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState("")

  const activeShopId = selectedShopId || defaultShopId
  const activeShop = useMemo(
    () => dashboards.find((shop) => shop.id === activeShopId) ?? dashboards[0] ?? null,
    [dashboards, activeShopId]
  )
  const products = activeShop ? productsStore?.[activeShop.id] ?? [] : []

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setMessage("")
  }

  function handleAddProduct(event) {
    event.preventDefault()

    if (!activeShop) {
      return
    }

    const productName = form.name.trim()
    if (!productName) {
      setMessage("Product name is required.")
      return
    }

    const nextStore = addShopManualProduct(activeShop.id, {
      name: productName,
      price: form.price,
      stock: form.stock,
    })

    setProductsStore(nextStore)
    setForm(EMPTY_FORM)
    setMessage("Product saved.")
  }

  function handleDeleteProduct(productId) {
    if (!activeShop) {
      return
    }

    const nextStore = removeShopManualProduct(activeShop.id, productId)
    setProductsStore(nextStore)
    setMessage("Product removed.")
  }

  return (
    <section className="ui-card rounded-[32px] p-6">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Simple Product Management</h2>
        <p className="text-sm text-[var(--ink-muted)]">Select a shop, add product details, and manage your list.</p>
      </div>

      <div className="mb-5">
        <label htmlFor="shopSelect" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Shop
        </label>
        <select
          id="shopSelect"
          value={activeShopId}
          onChange={(event) => setSelectedShopId(event.target.value)}
          className="ui-select rounded-2xl"
        >
          {dashboards.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.shop_name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleAddProduct} className="mb-6 grid gap-3 md:grid-cols-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Product name"
          className="ui-input rounded-2xl md:col-span-2"
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          placeholder="Price"
          className="ui-input rounded-2xl"
        />
        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleInputChange}
          min="0"
          step="1"
          placeholder="Stock"
          className="ui-input rounded-2xl"
        />
        <button
          type="submit"
          className="ui-btn-primary rounded-2xl px-5 py-3 text-sm md:col-span-4"
        >
          Save Product
        </button>
      </form>

      {message && <p className="mb-4 text-sm text-emerald-700">{message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-soft)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[var(--ink-muted)]">
                  No products added yet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{product.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{Number(product.stock || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="ui-btn-secondary px-3 py-1 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
