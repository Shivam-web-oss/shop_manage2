"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "../src/lib/supabase/client"

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/reports", label: "Reports" },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[var(--border)] bg-[rgba(9,12,12,0.78)] px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-white">
            ShopManager
          </Link>
          <span className="hidden rounded-full border border-[rgba(201,246,199,0.14)] bg-[rgba(201,246,199,0.08)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)] sm:inline-flex">
            Studio
          </span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isActive(link.href)
                  ? "bg-[var(--accent)] text-[#08100c]"
                  : "text-white/72 hover:bg-white/8 hover:text-white"
                }`}
              >
                {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/profile"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#08100c] transition hover:bg-[#dcffd9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-full border border-white/15 p-2 text-white md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="mt-3 rounded-[28px] border border-[var(--border)] bg-[rgba(9,12,12,0.94)] px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.34)] md:hidden">
          <div className="flex flex-col gap-2">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  isActive(link.href)
                    ? "bg-[var(--accent)] text-[#08100c]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white/85"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-left text-sm font-semibold text-[#08100c] disabled:opacity-70"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
