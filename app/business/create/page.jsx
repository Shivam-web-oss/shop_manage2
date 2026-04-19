"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const INITIAL_FORM = {
  companyName: "",
  shopName: "",
  location: "",
  description: "",
}

export default function CreateShopPage() {
  const router = useRouter()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!form.companyName.trim() || !form.shopName.trim() || !form.location.trim()) {
      setError("Company name, shop name, and location are required.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/business", {
        method: "POST",
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
        throw new Error(data.message || "Unable to create shop.")
      }

      setMessage("Shop created successfully.")
      setForm(INITIAL_FORM)
      setTimeout(() => {
        router.replace("/business")
        router.refresh()
      }, 700)
    } catch (submitError) {
      setError(submitError.message || "Unable to create shop.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Shop Setup</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Create New Shop</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Fill this once. You can edit or delete the shop anytime from shop details.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            className="ui-input"
            placeholder="Company name"
            value={form.companyName}
            onChange={(event) => setForm((previous) => ({ ...previous, companyName: event.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder="Shop name"
            value={form.shopName}
            onChange={(event) => setForm((previous) => ({ ...previous, shopName: event.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder="Location"
            value={form.location}
            onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
            required
          />
          <textarea
            className="ui-textarea"
            rows={4}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="ui-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create Shop"}
            </button>
            <Link href="/business" className="ui-btn-secondary px-5 py-3 text-sm">
              Back to Business
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
