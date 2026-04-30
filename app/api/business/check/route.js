/**
 * BEGINNER NOTES
 * File: app/api/business/check/route.js
 * Purpose: Server API endpoint (HTTP route).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { NextResponse } from "next/server"
import { createClient } from "../../../src/lib/supabase/server"
import { ROLES } from "@/lib/authz"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ exists: false }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ exists: false, message: profileError.message }, { status: 400 })
  }

  const role = profile?.role ?? user.user_metadata?.role
  if (role !== ROLES.BUSINESS) {
    return NextResponse.json({ exists: false, message: "Only business users can own shops." }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("business")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ exists: false, message: error.message }, { status: 200 })
  }

  return NextResponse.json({ exists: !!data })
}
