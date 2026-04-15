import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req) {
  try {
    const body = await req.json()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const selectedRole = body.role === "staff" ? "staff" : "admin"

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { message: "Supabase server configuration is missing." },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (existingProfileError) {
      return NextResponse.json(
        { message: existingProfileError.message },
        { status: 400 }
      )
    }

    if (existingProfile) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      )
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: selectedRole,
      },
    })

    if (error) {
      const message =
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("registered")
          ? "A user with this email already exists."
          : error.message

      return NextResponse.json({ message }, { status: 400 })
    }

    const userId = data.user?.id

    if (!userId) {
      return NextResponse.json(
        { message: "User was created without an id." },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
      id: userId,
      full_name: name,
      role: selectedRole,
      email,
      updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (profileError) {
      return NextResponse.json(
        { message: profileError.message },
        { status: 400 }
      )
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: selectedRole,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (roleError) {
      return NextResponse.json(
        { message: roleError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: userId,
          email,
          full_name: name,
          role: selectedRole,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    )
  }
}
