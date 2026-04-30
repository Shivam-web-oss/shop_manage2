"use client"

/**
 * BEGINNER NOTES
 * File: app/src/registration.jsx
 * Purpose: Project file.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import PublicAuthShell from "../components/public/public-auth-shell"
import { useUiLanguage } from "../components/ui/ui-language"

export default function RegisterPage() {
  const router = useRouter()
  const { copy } = useUiLanguage()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "business",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name || !form.email || !form.password) {
      setError(copy("All fields are required.", "सभी जानकारी भरना जरूरी है।"))
      return
    }

    if (form.password.length < 6) {
      setError(copy("Password must be at least 6 characters.", "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।"))
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || copy("Registration failed.", "रजिस्ट्रेशन नहीं हो सका।"))
      }

      setSuccess(data.message || copy("Account created successfully.", "खाता सफलतापूर्वक बन गया।"))
      setTimeout(() => {
        router.replace("/login")
      }, 1000)
    } catch (submitError) {
      setError(submitError.message || copy("Something went wrong.", "कुछ गड़बड़ हो गई।"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center py-6">
      <PublicAuthShell mode="register">
        <form onSubmit={handleSubmit}>
          <p className="ui-eyebrow">{copy("Register", "रजिस्टर करें")}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            {copy("Create your account", "अपना खाता बनाएं")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)] sm:text-base">
            {copy(
              "Set up your ShopManager workspace once, then move into shops, products, staff access, and billing.",
              "अपना ShopManager वर्कस्पेस एक बार सेट करें, फिर शॉप, प्रोडक्ट, स्टाफ एक्सेस और बिलिंग में आगे बढ़ें।"
            )}
          </p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy("Full name", "पूरा नाम")}</span>
              <input
                type="text"
                name="name"
                placeholder={copy("Enter your full name", "अपना पूरा नाम लिखें")}
                value={form.name}
                onChange={handleChange}
                className="ui-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy("Email", "ईमेल")}</span>
              <input
                type="email"
                name="email"
                placeholder={copy("Enter your email", "अपना ईमेल लिखें")}
                value={form.email}
                onChange={handleChange}
                className="ui-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy("Password", "पासवर्ड")}</span>
              <input
                type="password"
                name="password"
                placeholder={copy("Create a password", "पासवर्ड बनाएं")}
                value={form.password}
                onChange={handleChange}
                className="ui-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy("Role", "भूमिका")}</span>
              <select
                title={copy("Role", "भूमिका")}
                name="role"
                value={form.role}
                onChange={handleChange}
                className="ui-select mt-2"
              >
                <option value="admin">{copy("Admin", "एडमिन")}</option>
                <option value="business">{copy("Business Owner", "बिजनेस ओनर")}</option>
                <option value="staff">{copy("Staff", "स्टाफ")}</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ui-btn-primary mt-6 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? copy("Creating account...", "खाता बन रहा है...") : copy("Register", "रजिस्टर करें")}
          </button>

          {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-center text-sm text-emerald-700">{success}</p> : null}

          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--ink-muted)]">
            <p className="font-medium text-[var(--foreground)]">{copy("Already have access?", "पहले से एक्सेस है?")}</p>
            <p className="mt-2 leading-6">
              {copy(
                "Use the login page to return to your existing workspace without creating a second account.",
                "दूसरा खाता बनाए बिना अपने मौजूदा वर्कस्पेस में जाने के लिए लॉग इन पेज का उपयोग करें।"
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
            {copy("Already have an account?", "क्या आपका खाता पहले से है?")}{" "}
            <Link href="/login" className="font-semibold text-[var(--accent-deep)] hover:underline">
              {copy("Login now", "अभी लॉग इन करें")}
            </Link>
          </p>
        </form>
      </PublicAuthShell>
    </div>
  )
}
