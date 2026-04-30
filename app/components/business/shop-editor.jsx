"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/shop-editor.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ShopEditor({ shop }) {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: shop.company_name ?? "",
    shopName: shop.shop_name ?? "",
    location: shop.location ?? "",
    description: shop.description ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function saveShop(event) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!form.companyName.trim() || !form.shopName.trim() || !form.location.trim()) {
      setError("Company name, shop name, and location are required.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/business/${shop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          shopName: form.shopName.trim(),
          location: form.location.trim(),
          description: form.description.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to update shop.")
      }

      setMessage("Shop updated successfully.")
      router.refresh()
    } catch (saveError) {
      setError(saveError.message || "Unable to update shop.")
    } finally {
      setLoading(false)
    }
  }

  async function deleteShop() {
    const confirmed = window.confirm("Delete this shop permanently?")
    if (!confirmed) return

    setLoading(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`/api/business/${shop.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete shop.")
      }

      router.replace("/business")
      router.refresh()
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete shop.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ui-card rounded-3xl p-6">
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">Edit Shop Details</h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Update shop information anytime. Changes are saved instantly.</p>

      <form onSubmit={saveShop} className="mt-5 space-y-3">
        <input
          className="ui-input"
          value={form.companyName}
          onChange={(event) => setForm((previous) => ({ ...previous, companyName: event.target.value }))}
          placeholder="Company name"
          required
        />
        <input
          className="ui-input"
          value={form.shopName}
          onChange={(event) => setForm((previous) => ({ ...previous, shopName: event.target.value }))}
          placeholder="Shop name"
          required
        />
        <input
          className="ui-input"
          value={form.location}
          onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
          placeholder="Location"
          required
        />
        <textarea
          className="ui-textarea"
          rows={4}
          value={form.description}
          onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
          placeholder="Description (optional)"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="ui-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Shop"}
          </button>
          <button
            type="button"
            onClick={deleteShop}
            className="ui-btn-secondary px-5 py-3 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            Delete Shop
          </button>
        </div>
      </form>
    </section>
  )
}
