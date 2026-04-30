/**
 * BEGINNER NOTES
 * File: app/components/staff/mnt/user-data/outputs/employee/app/employee/stock/page.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { redirect } from "next/navigation"

export default function LegacyEmployeeStockPage() {
  redirect("/employee/stock")
}
