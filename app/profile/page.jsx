/**
 * BEGINNER NOTES
 * File: app/profile/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import ProfilePanel from "../components/profile-panel"

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ProfilePanel />
    </div>
  )
}
