/**
 * BEGINNER NOTES
 * File: app/admin/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import AdminBusinessDirectory from "@/app/components/admin/admin-business-directory"
import { ROLES, requireRole } from "@/lib/authz"
import { getAdminBusinessDirectory } from "@/lib/admin"

export default async function AdminPage() {
  // Guardrail: only allow ADMIN users to open this page.
  // `requireRole` typically:
  // - checks the signed-in user (auth)
  // - verifies their role is in the allowed list
  // - returns a "context" object with tools like `supabase` for DB access
  const context = await requireRole([ROLES.ADMIN])

  // Fetch the "business directory" rows shown in the UI.
  // Data source: Supabase tables (see `getAdminBusinessDirectory`).
  const businesses = await getAdminBusinessDirectory(context.supabase)

  // Render the client component that shows search + table UI.
  // We pass the fetched data as a prop so the component can filter it locally.
  return <AdminBusinessDirectory businesses={businesses} />
}
