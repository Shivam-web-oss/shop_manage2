import Link from "next/link"
import BillCreator from "@/app/components/employee/bill-creator"
import { requireEmployeeWorkspaceAccess } from "@/lib/authz"

export default async function EmployeeBillPage() {
  await requireEmployeeWorkspaceAccess()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Employee Billing</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Create Customer Bill</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Pick products, update quantity or rate if needed, and generate a bill in one flow.
        </p>
        <div className="mt-4">
          <Link href="/employee" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Employee Home
          </Link>
        </div>
      </section>

      <BillCreator />
    </div>
  )
}
