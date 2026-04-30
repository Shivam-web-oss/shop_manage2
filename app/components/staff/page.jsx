"use client"

/**
 * BEGINNER NOTES
 * File: app/components/staff/page.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"

export default function EmployeeDashboard() {
  const cards = [
    {
      title: "Update Stock",
      description: "Add or reduce product quantity in a few clicks.",
      href: "/employee/stock",
      accent: "#00C896",
      tag: "ST",
    },
    {
      title: "Create Bill",
      description: "Generate bills quickly for customer purchases.",
      href: "/employee/bill",
      accent: "#F5A623",
      tag: "BL",
    },
    {
      title: "View Reports",
      description: "Check billing and stock activity for the day.",
      href: "/employee/reports",
      accent: "#6C8EF5",
      tag: "RP",
    },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Employee Workspace</p>
          <h1 className="mt-3 text-4xl font-semibold">Choose what you want to do</h1>
          <p className="mt-2 text-sm text-white/60">Simple steps for billing, stock updates, and reports.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/30"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold"
                style={{ background: `${card.accent}22`, color: card.accent, border: `1px solid ${card.accent}55` }}
              >
                {card.tag}
              </span>
              <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-white/60">{card.description}</p>
              <p className="mt-4 text-sm font-medium" style={{ color: card.accent }}>
                Open
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
