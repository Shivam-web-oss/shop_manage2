import { createClient } from "./supabase/server"
import { normalizeRole } from "./authz"

export async function getApiAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle()

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

export function hasAnyRole(role, allowedRoles) {
  return Array.isArray(allowedRoles) && allowedRoles.includes(role)
}
