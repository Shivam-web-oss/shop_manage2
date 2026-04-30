/**
 * BEGINNER NOTES
 * File: app/business/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import BusinessOverviewShell from "@/app/components/business/business-overview-shell"
import { getUserDashboards } from "@/lib/business"

export default async function BusinessOverviewPage() {
  const shops = await getUserDashboards()

  return <BusinessOverviewShell shops={shops} />
}
