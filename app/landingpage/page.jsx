/**
 * BEGINNER NOTES
 * File: app/landingpage/page.jsx
 * Purpose: A Next.js route page (screen) shown to the user.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import PublicWelcome from "@/app/components/public/public-welcome"

export const metadata = {
  title: "Welcome",
  description: "Welcome to ShopManager and choose whether to log in or create a new workspace.",
}

export default function LandingPage() {
  return <PublicWelcome />
}
