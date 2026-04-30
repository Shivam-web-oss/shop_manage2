"use client"

/**
 * BEGINNER NOTES
 * File: app/business/create/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useUiLanguage } from "@/app/components/ui/ui-language"

const INITIAL_FORM = {
  companyName: "",
  shopName: "",
  location: "",
  description: "",
}

export default function CreateShopPage() {
  const router = useRouter()
  const { copy } = useUiLanguage()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!form.companyName.trim() || !form.shopName.trim() || !form.location.trim()) {
      setError(copy("Company name, shop name, and location are required.", "कंपनी का नाम, दुकान का नाम और जगह भरना जरूरी है।"))
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
        throw new Error(data.message || copy("Unable to create shop.", "दुकान नहीं बन सकी।"))
      }

      setMessage(copy("Shop created successfully.", "दुकान सफलतापूर्वक बन गई।"))
      setForm(INITIAL_FORM)
      setTimeout(() => {
        router.replace("/business")
        router.refresh()
      }, 700)
    } catch (submitError) {
      setError(submitError.message || copy("Unable to create shop.", "दुकान नहीं बन सकी।"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="ui-card rounded-3xl p-6">
        <p className="ui-eyebrow">{copy("Shop Setup", "दुकान की शुरुआत")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
          {copy("Add a new shop", "नई दुकान जोड़ें")}
        </h1>
        <p className="mt-2 text-base text-[var(--ink-muted)]">
          {copy(
            "Fill these simple details once. You can change them later anytime.",
            "यह आसान जानकारी एक बार भरें। बाद में कभी भी बदल सकते हैं।"
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            className="ui-input"
            placeholder={copy("Company name", "कंपनी का नाम")}
            value={form.companyName}
            onChange={(event) => setForm((previous) => ({ ...previous, companyName: event.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder={copy("Shop name", "दुकान का नाम")}
            value={form.shopName}
            onChange={(event) => setForm((previous) => ({ ...previous, shopName: event.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder={copy("Location", "जगह")}
            value={form.location}
            onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
            required
          />
          <textarea
            className="ui-textarea"
            rows={4}
            placeholder={copy("Short note (optional)", "छोटा नोट (जरूरी नहीं)")}
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
              {loading ? copy("Creating...", "बन रही है...") : copy("Create Shop", "दुकान बनाएं")}
            </button>
            <Link href="/business" className="ui-btn-secondary px-5 py-3 text-sm">
              {copy("Back to Home", "होम पर वापस")}
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
