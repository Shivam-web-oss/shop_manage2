"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateDashboardPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: "",
    shopName: "",
    location: "",
    description: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const payload = {
      companyName: form.companyName.trim(),
      shopName: form.shopName.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
    }

    if (!payload.companyName || !payload.shopName || !payload.location) {
      setError("Please fill in all required fields.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/business/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.message || "Unable to create business.")
        return
      }

      setSuccess("Business created successfully!")
      setForm(payload)

      setTimeout(() => {
        router.replace("/business")
      }, 1000)
    } catch {
      setError("Something went wrong while saving your business.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white/95 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Welcome to ShopManager</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Create your new business</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tell us a little about your first shop and we will save your business profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-slate-700">
              Company name
            </label>
            <input
              id="companyName"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="Example: Golden Bean Coffee"
            />
          </div>

          <div>
            <label htmlFor="shopName" className="mb-2 block text-sm font-medium text-slate-700">
              Shop name
            </label>
            <input
              id="shopName"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="Example: Downtown Store"
            />
          </div>

          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="City, State"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
              Business description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="Describe the shop or business purpose"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving business..." : "Create business"}
          </button>
        </form>
      </div>
    </div>
  )
}
