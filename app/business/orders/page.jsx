/**
 * BEGINNER NOTES
 * File: app/business/orders/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import ProductsManager from "@/app/components/business/products-manager"
import { ROLES, requireRole } from "@/lib/authz"

export default async function BusinessProductsPage() {
  await requireRole([ROLES.BUSINESS])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Product Management</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Create, Edit, and Delete Products</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Business users can fully manage product details including name, price, quantity, and unit.
        </p>
        <div className="mt-4">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
        </div>
      </section>

      <ProductsManager />
    </div>
  )
}
