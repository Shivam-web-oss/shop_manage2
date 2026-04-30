/**
 * BEGINNER NOTES
 * File: app/business/reports/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import ActivityBoard from "@/app/components/business/activity-board"
import { ROLES, requireRole } from "@/lib/authz"

export default async function BusinessReportsPage() {
  await requireRole([ROLES.BUSINESS])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Dashboard Reports</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Complete Activity View</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          See real-time business activity including bills, stock updates, and key metrics.
        </p>
        <div className="mt-4">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
        </div>
      </section>

      <ActivityBoard limit={40} />
    </div>
  )
}
