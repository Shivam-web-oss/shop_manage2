import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

export const ROLES = Object.freeze({
  ADMIN: "admin",
  BUSINESS: "business",
  STAFF: "staff",
})

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

export function canAccessEmployeeWorkspace(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ROLES.STAFF || normalizedRole === ROLES.BUSINESS
}

export async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

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

  const role = normalizeRole(profile?.role ?? user.user_metadata?.role)

  return {
    supabase,
    user,
    profile,
    role,
    profileError: profileError?.message ?? null,
  }
}

export async function requireAuth(redirectTo = "/login") {
  const context = await getAuthContext()

  if (!context.user) {
    redirect(redirectTo)
  }

  return context
}

export async function requireRole(allowedRoles, fallbackPath) {
  const context = await requireAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(context.role)) {
    redirect(fallbackPath ?? getHomeRouteByRole(context.role))
  }

  return context
}

export async function requireEmployeeWorkspaceAccess() {
  const context = await requireAuth()

  if (!canAccessEmployeeWorkspace(context.role)) {
    redirect(getHomeRouteByRole(context.role))
  }

  return context
}
