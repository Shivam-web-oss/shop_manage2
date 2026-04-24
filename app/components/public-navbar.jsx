"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import LanguageToggle from "./ui/language-toggle"
import { useUiLanguage } from "./ui/ui-language"

const PUBLIC_ROUTES = ["/", "/login", "/landingpage", "/register", "/signup"]

export default function PublicNavbar() {
  const pathname = usePathname()
  const { copy } = useUiLanguage()

  if (!pathname || !PUBLIC_ROUTES.includes(pathname)) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-[1.75rem] px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-deep)]">
            SM
          </span>
          <span>ShopManager</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/#results"
            className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {copy("What it helps with", "यह क्या मदद करता है")}
          </Link>
          <Link
            href="/#impact"
            className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {copy("Why it is easy", "यह आसान क्यों है")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/login"
            className="ui-btn-secondary min-h-10 px-4 py-2 text-sm text-slate-700 hover:text-slate-900"
          >
            {copy("Login", "लॉग इन")}
          </Link>
          <Link href="/register" className="ui-btn-primary min-h-10 px-4 py-2 text-sm">
            {copy("Sign Up", "साइन अप")}
          </Link>
        </div>
      </div>
    </nav>
  )
}
