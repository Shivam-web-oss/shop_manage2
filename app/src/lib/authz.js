/**
 * BEGINNER NOTES
 * File: app/src/lib/authz.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

// App roles.
// These strings are stored in `profiles.role` (Supabase) and sometimes in auth metadata.
export const ROLES = Object.freeze({
  ADMIN: "admin",
  BUSINESS: "business",
  STAFF: "staff",
})

// Ensures we always end up with a known role string.
// If the stored value is missing/invalid, we default to `BUSINESS`.
export function normalizeRole(role) {
  const normalized = String(role ?? "")
    .trim()
    .toLowerCase()

  if (normalized === ROLES.ADMIN) {
    return ROLES.ADMIN
  }

  if (normalized === ROLES.STAFF) {
    return ROLES.STAFF
  }

  if (normalized === ROLES.BUSINESS || normalized === "bussiness") {
    return ROLES.BUSINESS
  }

  return ROLES.BUSINESS
}

// When we know a user's role, choose the right "home" page for them.
export function getHomeRouteByRole(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === ROLES.ADMIN) {
    return "/admin"
  }

  if (normalizedRole === ROLES.STAFF) {
    return "/employee"
  }

  return "/business"
}

// Staff and business users can use the employee workspace screens.
export function canAccessEmployeeWorkspace(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ROLES.STAFF || normalizedRole === ROLES.BUSINESS
}

// Reads auth + profile for the current request.
// Data sources:
// - Supabase Auth session cookies
// - Supabase table `profiles` (full_name/email/role)
export async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If user is missing, the caller is not logged in.
  if (authError || !user) {
    return {
      supabase,
      user: null,
      profile: null,
      role: null,
      authError: authError?.message ?? "Authentication required.",
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle()

  // Even if profile is missing, we still compute a role (defaulting if needed).
  const role = normalizeRole(profile?.role ?? user.user_metadata?.role)

  return {
    supabase,
    user,
    profile,
    role,
    profileError: profileError?.message ?? null,
  }
}

// Enforces login: redirects to `/login` when no user is present.
export async function requireAuth(redirectTo = "/login") {
  const context = await getAuthContext()

  if (!context.user) {
    redirect(redirectTo)
  }

  return context
}

// Enforces a role: redirects away if the current user's role isn't allowed.
export async function requireRole(allowedRoles, fallbackPath) {
  const context = await requireAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(context.role)) {
    redirect(fallbackPath ?? getHomeRouteByRole(context.role))
  }

  return context
}

// Convenience wrapper: only allow STAFF/BUSINESS to access employee workspace pages.
export async function requireEmployeeWorkspaceAccess() {
  const context = await requireAuth()

  if (!canAccessEmployeeWorkspace(context.role)) {
    redirect(getHomeRouteByRole(context.role))
  }

  return context
}
