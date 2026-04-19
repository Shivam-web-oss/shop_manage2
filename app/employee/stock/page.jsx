import Link from "next/link"
import StockAdjuster from "@/app/components/business/stock-adjuster"
import { requireEmployeeWorkspaceAccess } from "@/lib/authz"

export default async function EmployeeStockPage() {
  await requireEmployeeWorkspaceAccess()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Stock Update</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Adjust Product Quantity</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Enter positive numbers to add stock or negative numbers to reduce stock.
        </p>
        <div className="mt-4">
          <Link href="/employee" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Employee Home
          </Link>
        </div>
      </section>

      <StockAdjuster title="Update Stock Quantity" subtitle="Each saved change is recorded in your activity log." />
    </div>
  )
}
