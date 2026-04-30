/**
 * BEGINNER NOTES
 * File: app/business/customers/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { redirect } from "next/navigation"

export default function BusinessCustomersPage() {
  redirect("/business/staff")
}
