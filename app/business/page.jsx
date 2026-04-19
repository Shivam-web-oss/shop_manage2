import Link from "next/link"
import ActivityBoard from "@/app/components/business/activity-board"
import { getUserDashboards } from "@/lib/business"

export default async function BusinessOverviewPage() {
  const shops = await getUserDashboards()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Business Control Center</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">Everything in one place</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--ink-muted)]">
          Create and edit shops, manage products, control staff access, create bills, and monitor complete dashboard
          activity from this workspace.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/business/create" className="ui-btn-primary px-5 py-3 text-sm">
            Create Shop
          </Link>
          <Link href="/business/orders" className="ui-btn-secondary px-5 py-3 text-sm">
            Manage Products
          </Link>
          <Link href="/business/staff" className="ui-btn-secondary px-5 py-3 text-sm">
            Manage Staff
          </Link>
          <Link href="/employee/bill" className="ui-btn-secondary px-5 py-3 text-sm">
            Create Bill
          </Link>
        </div>
      </section>

      <section className="ui-card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Your Shops</h2>
            <p className="text-sm text-[var(--ink-muted)]">Click a shop to edit details or remove it.</p>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">{shops.length} total</p>
        </div>

        {shops.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--ink-muted)]">
            No shops created yet. Use <strong>Create Shop</strong> to get started.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/business/shops/${shop.id}`}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">{shop.company_name}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{shop.shop_name}</p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{shop.location}</p>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  Created {shop.created_at ? new Date(shop.created_at).toLocaleDateString() : "N/A"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Live Dashboard Activity</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Real billing, stock, and operational updates from your backend.
        </p>
        <div className="mt-5">
          <ActivityBoard limit={20} />
        </div>
      </section>
    </div>
  )
}
