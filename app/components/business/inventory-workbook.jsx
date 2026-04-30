"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/inventory-workbook.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { useMemo, useState } from "react"

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))
}

function formatDateTime(value) {
  if (!value) return "Not updated"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function buildDescription(product) {
  const parts = [product.category, product.unit].filter(Boolean)
  return parts.length ? parts.join(" • ") : "Not set"
}

function buildInventoryId(product) {
  if (product.sku) return product.sku
  return String(product.id ?? "").slice(0, 8).toUpperCase()
}

function getRowTone(index) {
  return index % 2 === 0 ? "bg-[#f8e7d2]" : "bg-white"
}

export default function InventoryWorkbook({ shops, initialShopId }) {
  const [selectedShopId, setSelectedShopId] = useState(initialShopId ?? shops[0]?.id ?? "")

  const activeShop = useMemo(() => {
    return shops.find((shop) => shop.id === selectedShopId) ?? shops[0] ?? null
  }, [selectedShopId, shops])

  const products = useMemo(() => activeShop?.products ?? [], [activeShop])
  const latestUpdatedAt = useMemo(() => {
    return products.reduce((latest, product) => {
      if (!product.updated_at) return latest
      if (!latest) return product.updated_at
      return new Date(product.updated_at) > new Date(latest) ? product.updated_at : latest
    }, "")
  }, [products])

  return (
    <section className="rounded-[2rem] border border-[#d7c0ab] bg-[#f4e2d0] p-4 shadow-[0_18px_40px_rgba(73,54,38,0.14)] sm:p-6">
      <div className="rounded-[1.5rem] border border-[#d9c2ab] bg-[#f6e7d7] p-4 sm:p-5">
        <div className="h-3 rounded-full bg-[#264657]" />
        <div className="mt-1 h-2 rounded-full bg-[#ef7f4d]" />
        <div className="mt-1 h-1.5 rounded-full bg-[#f5c86a]" />

        <div className="px-2 py-8 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#4f6c79]">Inventory Workbook</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-[0.04em] text-[#264657] sm:text-6xl">
            Inventory List
          </h2>
          <p className="mt-3 text-sm text-[#5e5a52]">
            Excel-style stock view using live product values from your database.
          </p>
        </div>

        <div className="h-3 rounded-full bg-[#264657]" />
        <div className="mt-1 h-2 rounded-full bg-[#ef7f4d]" />
        <div className="mt-1 h-1.5 rounded-full bg-[#f5c86a]" />

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block max-w-sm">
            <span className="mb-2 block text-sm font-semibold text-[#264657]">Choose shop</span>
            <select
              className="ui-select border-[#cfb59d] bg-white text-[#264657]"
              value={activeShop?.id ?? ""}
              onChange={(event) => setSelectedShopId(event.target.value)}
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shop_name}
                </option>
              ))}
            </select>
          </label>

          {activeShop ? (
            <div className="flex flex-wrap gap-3 text-sm text-[#5e5a52]">
              <div className="rounded-full bg-white px-4 py-2 shadow-sm">{activeShop.company_name}</div>
              <div className="rounded-full bg-white px-4 py-2 shadow-sm">{activeShop.location}</div>
              <div className="rounded-full bg-white px-4 py-2 shadow-sm">{products.length} item(s)</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-[#d2b79d] bg-[#f8e8d8]">
          <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-[#264657] text-sm font-semibold text-white">
                <th className="px-4 py-4">Inventory ID</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Description</th>
                <th className="px-4 py-4">Unit price</th>
                <th className="px-4 py-4">Quantity in stock</th>
                <th className="px-4 py-4">Reorder level</th>
                <th className="px-4 py-4">Reorder time in days</th>
                <th className="px-4 py-4">Quantity in reorder</th>
                <th className="px-4 py-4">Discontinued?</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-sm text-[#5e5a52]">
                    No products found for this shop yet.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id} className={`${getRowTone(index)} text-sm text-[#193446]`}>
                    <td className="px-4 py-4 font-semibold">{buildInventoryId(product)}</td>
                    <td className="px-4 py-4">{product.name || "Unnamed product"}</td>
                    <td className="px-4 py-4">{buildDescription(product)}</td>
                    <td className="px-4 py-4">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">{Number(product.quantity ?? 0)}</td>
                    <td className="px-4 py-4 text-[#6a655c]">Not set</td>
                    <td className="px-4 py-4 text-[#6a655c]">Not set</td>
                    <td className="px-4 py-4 text-[#6a655c]">Not set</td>
                    <td className="px-4 py-4">N</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-[#5e5a52] sm:flex-row sm:items-center sm:justify-between">
          <p>Fields not stored in the database yet are shown as `Not set` so the sheet stays faithful to live data.</p>
          <p>Last product update: {formatDateTime(latestUpdatedAt)}</p>
        </div>

        {activeShop ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/business/shops/${activeShop.id}`} className="ui-btn-secondary px-4 py-2 text-sm">
              Open Shop
            </Link>
            <Link href="/business/orders" className="ui-btn-secondary px-4 py-2 text-sm">
              Manage Products
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
