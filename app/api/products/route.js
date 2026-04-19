import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { normalizeProductPayload } from "@/lib/products"

export async function GET() {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view products." }, { status: 403 })
  }

  const { data, error } = await context.supabase
    .from("products")
    .select("id, name, sku, category, price, quantity, unit, created_at, updated_at")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ products: data ?? [] }, { status: 200 })
}

export async function POST(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can create products." }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const payload = normalizeProductPayload(body)
  if (!payload.name) {
    return NextResponse.json({ message: "Product name is required." }, { status: 400 })
  }

  const { data, error } = await context.supabase
    .from("products")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, sku, category, price, quantity, unit, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ product: data, message: "Product created successfully." }, { status: 201 })
}
