import { ROLES, requireRole } from "./authz"

export async function getAuthenticatedUser() {
  const context = await requireRole([ROLES.BUSINESS])
  return {
    supabase: context.supabase,
    user: context.user,
    profile: context.profile,
    role: context.role,
  }
}

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

export async function getDashboardById(id) {
  const dashboards = await getUserDashboards()
  return dashboards.find((business) => business.id === id) ?? null
}
