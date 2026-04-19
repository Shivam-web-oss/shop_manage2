"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const router = useRouter()

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
      setError("All fields are required.")
      return
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.")
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
        throw new Error(data.message || "Registration failed.")
      }

      setSuccess(data.message || "Account created successfully.")
      setTimeout(() => {
        router.replace("/login")
      }, 1000)
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--foreground)]">Create Account</h1>

        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={handleChange}
          className="ui-input mb-4"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="ui-input mb-4"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="ui-input mb-4"
        />

        <select
          title="Role"
          name="role"
          value={form.role}
          onChange={handleChange}
          className="ui-select mb-4"
        >
          <option value="admin">Admin</option>
          <option value="business">Business Owner</option>
          <option value="staff">Staff</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="ui-btn-primary w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-center text-sm text-emerald-700">{success}</p>}

        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent-deep)] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
