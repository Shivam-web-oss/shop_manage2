import { redirect } from "next/navigation"
import { createClient } from "./supabase/server"

export type DashboardRecord = {
  id: string
  company_name: string
  shop_name: string
  location: string
  description: string | null
  created_at: string
  user_id: string
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return { supabase, user }
}

export async function getUserDashboards() {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from("dashboards")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as DashboardRecord[]
}

export async function getDashboardById(id: string) {
  const dashboards = await getUserDashboards()
  return dashboards.find((dashboard) => dashboard.id === id) ?? null
}
