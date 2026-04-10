import { NextResponse } from "next/server"
import { createClient } from "../../../src/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ exists: false }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("dashboards")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ exists: false, message: error.message }, { status: 200 })
  }

  return NextResponse.json({ exists: !!data })
}
