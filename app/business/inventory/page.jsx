import Link from "next/link"
import StockAdjuster from "@/app/components/business/stock-adjuster"
import { ROLES, requireRole } from "@/lib/authz"

export default async function BusinessInventoryPage() {
  await requireRole([ROLES.BUSINESS])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Inventory Operations</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Update Product Quantity</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Add or reduce stock quantity with full history tracking. Staff can also do this if you allow access.
        </p>
        <div className="mt-4">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
        </div>
      </section>

      <StockAdjuster />
    </div>
  )
}
