/**
 * BEGINNER NOTES
 * File: app/src/lib/business.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { ROLES, requireRole } from "./authz"

// Reads the currently logged-in BUSINESS user and returns the auth context.
// Why: business pages need both the `supabase` client and the `user` identity.
export async function getAuthenticatedUser() {
  const context = await requireRole([ROLES.BUSINESS])
  return {
    supabase: context.supabase,
    user: context.user,
    profile: context.profile,
    role: context.role,
  }
}

// Fetches all "shops/business dashboards" owned by the current business user.
// Data source: Supabase table `business` where `user_id` = current user id.
export async function getUserDashboards() {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from("business")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

// Finds one business dashboard by id, but only within the current user's own shops.
// Why: prevents users from seeing another user's shop by guessing an ID.
export async function getDashboardById(id) {
  const dashboards = await getUserDashboards()
  return dashboards.find((business) => business.id === id) ?? null
}
