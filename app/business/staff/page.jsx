/**
 * BEGINNER NOTES
 * File: app/business/staff/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import StaffManager from "@/app/components/business/staff-manager"
import { ROLES, requireRole } from "@/lib/authz"

export default async function BusinessStaffPage() {
  await requireRole([ROLES.BUSINESS])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Staff Management</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Create Staff and Control Access</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Staff can only edit their profile. Business owners can decide whether staff can create bills, update stock,
          and view reports.
        </p>
        <div className="mt-4">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
        </div>
      </section>

      <StaffManager />
    </div>
  )
}
