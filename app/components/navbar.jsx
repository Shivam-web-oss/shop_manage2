"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import { logoutAction } from "../actions/auth"

const BUSINESS_LINKS = [
  { href: "/business", label: "Business" },
  { href: "/business/create", label: "Shops" },
  { href: "/business/inventory", label: "Inventory" },
  { href: "/business/orders", label: "Products" },
  { href: "/business/staff", label: "Staff" },
  { href: "/business/reports", label: "Reports" },
]

const EMPLOYEE_LINKS = [
  { href: "/employee", label: "Employee" },
  { href: "/employee/stock", label: "Stock" },
  { href: "/employee/bill", label: "Billing" },
  { href: "/employee/reports", label: "Reports" },
]

const CUSTOMER_ROUTE_PREFIXES = ["/business", "/employee", "/profile"]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const showNavbar =
    Boolean(pathname) &&
    CUSTOMER_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!showNavbar) {
    return null
  }

  const isEmployeeArea = pathname.startsWith("/employee")
  const primaryLinks = isEmployeeArea ? EMPLOYEE_LINKS : BUSINESS_LINKS
  const homeHref = isEmployeeArea ? "/employee" : "/business"
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.88)] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href={homeHref} className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            ShopManager
          </Link>
          <span className="hidden rounded-full border border-[rgba(47,158,107,0.24)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent-deep)] sm:inline-flex">
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
                  ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/profile"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Profile
          </Link>
          <form action={logoutAction}>
            <LogoutButton className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-70" />
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-full border border-[var(--border)] p-2 text-slate-700 md:hidden"
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="mt-3 rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.12)] md:hidden">
          <div className="flex flex-col gap-2">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  isActive(link.href)
                    ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-slate-700"
            >
              Profile
            </Link>
            <form action={logoutAction}>
              <LogoutButton className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-left text-sm font-semibold text-white disabled:opacity-70" />
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}

function LogoutButton({ className }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  )
}
