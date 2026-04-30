/**
 * BEGINNER NOTES
 * File: app/api/business/route.js
 * Purpose: Server API endpoint (HTTP route).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { resolveShopScope, serializeShopScope } from "@/lib/shop-access"

function normalizeShopPayload(body = {}) {
  return {
    company_name: String(body.companyName ?? body.company_name ?? "").trim(),
    shop_name: String(body.shopName ?? body.shop_name ?? "").trim(),
    location: String(body.location ?? "").trim(),
    description: String(body.description ?? "").trim() || null,
  }
}

export async function GET() {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view shops." }, { status: 403 })
  }

  const scope = await resolveShopScope(context, { defaultToFirstShop: true })
  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  const access = serializeShopScope(scope)

  return NextResponse.json(
    {
      shops: access.shops,
      access: {
        active_shop_id: access.active_shop_id,
        shop_locked: access.shop_locked,
      },
    },
    { status: 200 }
  )
}

export async function POST(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can create shops." }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const payload = normalizeShopPayload(body)

  if (!payload.company_name || !payload.shop_name || !payload.location) {
    return NextResponse.json(
      { message: "Company name, shop name, and location are required." },
      { status: 400 }
    )
  }

  const { data, error } = await context.supabase
    .from("business")
    .insert({
      user_id: context.user.id,
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ shop: data, message: "Shop created successfully." }, { status: 201 })
}
