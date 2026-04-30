/**
 * BEGINNER NOTES
 * File: app/employee/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import EmployeeDashboard from "@/app/components/staff/page"
import { requireEmployeeWorkspaceAccess } from "@/lib/authz"

export default async function EmployeePage() {
  await requireEmployeeWorkspaceAccess()
  return <EmployeeDashboard />
}
