import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { normalizeProductPayload } from "@/lib/products"
import { getShopIdFromRequest, normalizeRequestedShopId, resolveShopScope } from "@/lib/shop-access"

const PRODUCT_SELECT_FIELDS = "id, shop_id, name, sku, category, price, stock, quantity, unit, created_at, updated_at"

function mapProductRow(row) {
  const normalizedQuantity = Number(row?.quantity ?? row?.stock ?? 0)

  return {
    ...row,
    stock: normalizedQuantity,
    quantity: normalizedQuantity,
    unit: row?.unit ?? "pcs",
  }
}

export async function GET(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view products." }, { status: 403 })
  }

  const scope = await resolveShopScope(context, {
    requestedShopId: getShopIdFromRequest(request),
    requireActiveShop: true,
  })

  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  const { data, error } = await context.supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("shop_id", scope.activeShopId)
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ products: (data ?? []).map(mapProductRow) }, { status: 200 })
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

  const scope = await resolveShopScope(context, {
    requestedShopId: normalizeRequestedShopId(body.shop_id, body.shopId),
    requireActiveShop: true,
  })

  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  const payload = normalizeProductPayload(body)
  if (!payload.name) {
    return NextResponse.json({ message: "Product name is required." }, { status: 400 })
  }

  const { data, error } = await context.supabase
    .from("products")
    .insert({
      shop_id: scope.activeShopId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(PRODUCT_SELECT_FIELDS)
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ product: mapProductRow(data), message: "Product created successfully." }, { status: 201 })
}
