import Link from "next/link"
import InventoryWorkbook from "@/app/components/business/inventory-workbook"
import StockAdjuster from "@/app/components/business/stock-adjuster"
import { ROLES, requireRole } from "@/lib/authz"
import { getInventoryWorkbook } from "@/lib/inventory"

export default async function BusinessInventoryPage() {
  const context = await requireRole([ROLES.BUSINESS])
  const shops = await getInventoryWorkbook(context.supabase, context.user.id)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Inventory Operations</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Inventory Sheet and Stock Updates</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Review live product values in the workbook layout below, then use the stock updater to add or reduce quantity.
        </p>
        <div className="mt-4">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
        </div>
      </section>

      {shops.length === 0 ? (
        <section className="ui-card rounded-3xl p-6">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">No inventory yet</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Create a shop and add products first. Once products exist, this page will show them in the Excel-style sheet.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/business/create" className="ui-btn-primary px-4 py-2 text-sm">
              Add Shop
            </Link>
            <Link href="/business/orders" className="ui-btn-secondary px-4 py-2 text-sm">
              Add Products
            </Link>
          </div>
        </section>
      ) : (
        <InventoryWorkbook shops={shops} initialShopId={shops[0]?.id ?? ""} />
      )}

      <StockAdjuster title="Update Stock Quantity" subtitle="Each saved change updates the live inventory sheet above." />
    </div>
  )
}
