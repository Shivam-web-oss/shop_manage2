"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const PUBLIC_ROUTES = ["/landingpage", "/register", "/signup"]

export default function PublicNavbar() {
  const pathname = usePathname()

  if (!pathname || !PUBLIC_ROUTES.includes(pathname)) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.88)] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <Link href="/landingpage" className="text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
          ShopManager
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/landingpage#results"
            className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Business Results
          </Link>
          <Link
            href="/landingpage#impact"
            className="rounded-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Why It Works
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  )
}
