/**
 * BEGINNER NOTES
 * File: app/src/lib/api-auth.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { createClient } from "./supabase/server"
import { normalizeRole } from "./authz"

// Helper for API routes: builds a consistent auth "context".
// Why: Every API route needs to know (1) who is calling, and (2) their role.
// Data sources:
// - Supabase Auth session from cookies (via `createClient()`).
// - Supabase table `profiles` for role/name/email.
export async function getApiAuthContext() {
  // Supabase client tied to the current request cookies.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If there's no authenticated user, API routes can return 401 (Unauthorized).
  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      message: authError?.message ?? "Authentication required.",
      supabase,
      user: null,
      profile: null,
      role: null,
    }
  }

  // Load the profile record that stores app-specific fields like `role`.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle()

  // If profile lookup fails, treat it as a bad request for this app.
  if (profileError) {
    return {
      ok: false,
      status: 400,
      message: profileError.message,
      supabase,
      user,
      profile: null,
      role: null,
    }
  }

  // Normalize role so typos/casing don't break authorization logic.
  const role = normalizeRole(profile?.role ?? user.user_metadata?.role)

  return {
    ok: true,
    status: 200,
    message: null,
    supabase,
    user,
    profile,
    role,
  }
}

// Tiny helper used by routes to check if the caller has one of the allowed roles.
export function hasAnyRole(role, allowedRoles) {
  return Array.isArray(allowedRoles) && allowedRoles.includes(role)
}
