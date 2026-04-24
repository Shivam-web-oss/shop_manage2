"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import { logoutAction } from "../actions/auth"
import LanguageToggle from "./ui/language-toggle"
import { useUiLanguage } from "./ui/ui-language"

const CUSTOMER_ROUTE_PREFIXES = ["/business", "/employee", "/profile"]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { copy } = useUiLanguage()

  const showNavbar =
    Boolean(pathname) &&
    CUSTOMER_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!showNavbar) {
    return null
  }

  const isEmployeeArea = pathname.startsWith("/employee")
  const businessLinks = [
    { href: "/business", label: copy("Home", "होम") },
    { href: "/business/create", label: copy("Shops", "दुकानें") },
    { href: "/business/inventory", label: copy("Stock", "स्टॉक") },
    { href: "/business/orders", label: copy("Items", "सामान") },
    { href: "/business/staff", label: copy("Team", "टीम") },
    { href: "/business/reports", label: copy("Reports", "रिपोर्ट") },
  ]
  const employeeLinks = [
    { href: "/employee", label: copy("Home", "होम") },
    { href: "/employee/stock", label: copy("Stock", "स्टॉक") },
    { href: "/employee/bill", label: copy("Bills", "बिल") },
    { href: "/employee/reports", label: copy("Reports", "रिपोर्ट") },
  ]
  const primaryLinks = isEmployeeArea ? employeeLinks : businessLinks
  const homeHref = isEmployeeArea ? "/employee" : "/business"
  const areaLabel = isEmployeeArea ? copy("Staff workspace", "स्टाफ वर्कस्पेस") : copy("Business workspace", "बिजनेस वर्कस्पेस")
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-[1.75rem] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={homeHref} className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-deep)]">
              SM
            </span>
            <span>ShopManager</span>
          </Link>
          <span className="hidden rounded-full border border-[rgba(47,158,107,0.24)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent-deep)] lg:inline-flex">
            {areaLabel}
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
          <LanguageToggle />
          <Link
            href="/profile"
            className="ui-btn-secondary min-h-10 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            {copy("Profile", "प्रोफाइल")}
          </Link>
          <form action={logoutAction}>
            <LogoutButton
              className="ui-btn-primary min-h-10 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              label={copy("Logout", "लॉग आउट")}
              pendingLabel={copy("Logging out...", "लॉग आउट हो रहा है...")}
            />
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-full border border-[var(--border)] p-2 text-slate-700 md:hidden"
          aria-label={copy("Toggle navigation", "मेन्यू खोलें")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="glass mt-3 rounded-[1.75rem] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <LanguageToggle className="w-full justify-center" />
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
              {copy("Profile", "प्रोफाइल")}
            </Link>
            <form action={logoutAction}>
              <LogoutButton
                className="ui-btn-primary w-full justify-start rounded-2xl px-4 py-3 text-left text-sm font-semibold disabled:opacity-70"
                label={copy("Logout", "लॉग आउट")}
                pendingLabel={copy("Logging out...", "लॉग आउट हो रहा है...")}
              />
            </form>
          </div>
        </div>
      ) : null}
    </nav>
  )
}

function LogoutButton({ className, label, pendingLabel }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  )
}
