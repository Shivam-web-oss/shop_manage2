import { NextResponse } from "next/server"
import { createClient } from "../../../src/lib/supabase/server"

export async function POST(request) {
  try {
    const body = await request.json()
    const companyName = body.companyName?.trim()
    const shopName = body.shopName?.trim()
    const location = body.location?.trim()
    const description = body.description?.trim() || null

    if (!companyName || !shopName || !location) {
      return NextResponse.json(
        { message: "Company name, shop name, and location are required." },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 })
    }

    const { error } = await supabase.from("business").insert({
      user_id: user.id,
      company_name: companyName,
      shop_name: shopName,
      location,
      description,
      created_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Business created successfully." }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
