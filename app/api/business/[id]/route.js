import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"

function normalizeShopPatch(body = {}) {
  const patch = {}

  if (Object.prototype.hasOwnProperty.call(body, "companyName") || Object.prototype.hasOwnProperty.call(body, "company_name")) {
    patch.company_name = String(body.companyName ?? body.company_name ?? "").trim()
  }
  if (Object.prototype.hasOwnProperty.call(body, "shopName") || Object.prototype.hasOwnProperty.call(body, "shop_name")) {
    patch.shop_name = String(body.shopName ?? body.shop_name ?? "").trim()
  }
  if (Object.prototype.hasOwnProperty.call(body, "location")) {
    patch.location = String(body.location ?? "").trim()
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    patch.description = String(body.description ?? "").trim() || null
  }

  return patch
}

async function findOwnedShop(supabase, shopId, userId) {
  const { data, error } = await supabase
    .from("business")
    .select("id, user_id")
    .eq("id", shopId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return { ok: false, status: 400, message: error.message, data: null }
  }

  if (!data) {
    return { ok: false, status: 404, message: "Shop not found.", data: null }
  }

  return { ok: true, status: 200, message: null, data }
}

export async function GET(_request, { params }) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can view shop details." }, { status: 403 })
  }

  const resolvedParams = await params
  const shopId = resolvedParams?.id
  if (!shopId) {
    return NextResponse.json({ message: "Shop id is required." }, { status: 400 })
  }

  const ownership = await findOwnedShop(context.supabase, shopId, context.user.id)
  if (!ownership.ok) {
    return NextResponse.json({ message: ownership.message }, { status: ownership.status })
  }

  const { data, error } = await context.supabase
    .from("business")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .eq("id", shopId)
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ shop: data }, { status: 200 })
}

export async function PATCH(request, { params }) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can edit shops." }, { status: 403 })
  }

  const resolvedParams = await params
  const shopId = resolvedParams?.id
  if (!shopId) {
    return NextResponse.json({ message: "Shop id is required." }, { status: 400 })
  }

  const ownership = await findOwnedShop(context.supabase, shopId, context.user.id)
  if (!ownership.ok) {
    return NextResponse.json({ message: ownership.message }, { status: ownership.status })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const patch = normalizeShopPatch(body)
  if (!Object.keys(patch).length) {
    return NextResponse.json({ message: "No fields were provided to update." }, { status: 400 })
  }

  if (patch.company_name === "" || patch.shop_name === "" || patch.location === "") {
    return NextResponse.json({ message: "Company name, shop name, and location cannot be empty." }, { status: 400 })
  }

  const { data, error } = await context.supabase
    .from("business")
    .update(patch)
    .eq("id", shopId)
    .eq("user_id", context.user.id)
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ shop: data, message: "Shop updated successfully." }, { status: 200 })
}

export async function DELETE(_request, { params }) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can delete shops." }, { status: 403 })
  }

  const resolvedParams = await params
  const shopId = resolvedParams?.id
  if (!shopId) {
    return NextResponse.json({ message: "Shop id is required." }, { status: 400 })
  }

  const ownership = await findOwnedShop(context.supabase, shopId, context.user.id)
  if (!ownership.ok) {
    return NextResponse.json({ message: ownership.message }, { status: ownership.status })
  }

  const { error } = await context.supabase
    .from("business")
    .delete()
    .eq("id", shopId)
    .eq("user_id", context.user.id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Shop deleted successfully." }, { status: 200 })
}
