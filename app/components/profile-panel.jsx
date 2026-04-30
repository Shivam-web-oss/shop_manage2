/**
 * BEGINNER NOTES
 * File: app/components/profile-panel.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { logoutAction } from "../actions/auth"
import { createClient } from "../src/lib/supabase/server"
import ProfileEditorForm from "./profile-editor-form"

export default async function ProfilePanel() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="glass mx-auto max-w-3xl rounded-3xl p-8 text-center shadow-2xl">
        <h2 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Welcome back</h2>
        <p className="mb-6 text-[var(--ink-muted)]">Please log in to view your profile details.</p>
        <Link href="/login" className="ui-btn-secondary px-6 py-3">
          Go to Login
        </Link>
      </div>
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "Shop Manager User"
  const role = profile?.role ?? "unknown"
  const dashboardHref = role === "admin" ? "/admin" : role === "staff" ? "/employee" : "/business"

  return (
    <div className="glass mx-auto max-w-3xl rounded-3xl p-8 shadow-2xl">
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[var(--accent-deep)]">Profile</p>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{fullName}</h1>
          <p className="mt-2 text-[var(--ink-muted)]">Role: {role}</p>
          <p className="mt-1 text-[var(--ink-muted)]">Signed in with {user.email}</p>
          {profileError && <p className="mt-2 text-sm text-red-600">{profileError.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="ui-panel rounded-3xl p-5">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">Account ID</p>
            <p className="break-all text-[var(--foreground)]">{user.id}</p>
          </div>
          <div className="ui-panel rounded-3xl p-5">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">Email</p>
            <p className="text-[var(--foreground)]">{user.email}</p>
          </div>
        </div>

        <div className="ui-panel rounded-3xl p-5">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">Edit profile</p>
          <ProfileEditorForm defaultName={fullName} />
        </div>

        <div className="ui-panel rounded-3xl p-5">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">Quick actions</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={logoutAction}>
              <button type="submit" className="ui-btn-secondary px-5 py-3">
                Logout
              </button>
            </form>
            <Link href={dashboardHref} className="ui-btn-primary px-5 py-3">
              Open Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
