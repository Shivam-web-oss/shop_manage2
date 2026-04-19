import Link from "next/link"
import ActivityBoard from "@/app/components/business/activity-board"
import { requireEmployeeWorkspaceAccess } from "@/lib/authz"

export default async function EmployeeReportsPage() {
  await requireEmployeeWorkspaceAccess()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Daily Report</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Billing and Stock Activity</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          View today’s revenue, bills, and stock movement in one place.
        </p>
        <div className="mt-4">
          <Link href="/employee" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Employee Home
          </Link>
        </div>
      </section>

      <ActivityBoard limit={20} compact />
    </div>
  )
}
