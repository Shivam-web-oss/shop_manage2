import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import {
  decrementStock,
  incrementStock,
  normalizeProductPayload,
  toPositiveInteger,
} from "@/lib/products"
import { applyShopScope, resolveShopScope } from "@/lib/shop-access"

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

async function getProductById(supabase, productId, scope) {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("id", productId)

  if (scope) {
    query = applyShopScope(query, scope)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return { ok: false, status: 400, message: error.message, data: null }
  }

  if (!data) {
    return { ok: false, status: 404, message: "Product not found.", data: null }
  }

  return { ok: true, status: 200, message: null, data: mapProductRow(data) }
}

function normalizeProductPatch(body = {}) {
  const patch = {}
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field)

  if (has("name")) {
    patch.name = String(body.name ?? "").trim()
  }
  if (has("sku")) {
    patch.sku = String(body.sku ?? "").trim() || null
  }
  if (has("category")) {
    patch.category = String(body.category ?? "").trim() || null
  }
  if (has("unit")) {
    patch.unit = String(body.unit ?? "").trim() || "pcs"
  }
  if (has("price")) {
    patch.price = normalizeProductPayload({ price: body.price }).price
  }
  if (has("quantity")) {
    patch.quantity = normalizeProductPayload({ quantity: body.quantity }).quantity
  }

  return patch
}

async function logStockChange(supabase, scope, productId, quantityAdded, note) {
  await supabase.from("products").update({
    updated_at: new Date().toISOString(),
  }).eq("id", productId).eq("shop_id", scope.shopId)
}

export async function PATCH(request, { params }) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to update products." }, { status: 403 })
  }

  const resolvedParams = await params
  const productId = resolvedParams?.id
  if (!productId) {
    return NextResponse.json({ message: "Product id is required." }, { status: 400 })
  }

  const scope = await resolveShopScope(context)
  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const existing = await getProductById(context.supabase, productId, scope)
  if (!existing.ok) {
    return NextResponse.json({ message: existing.message }, { status: existing.status })
  }

  if (context.role === ROLES.STAFF) {
    if (!scope.permissions.can_update_stock) {
      return NextResponse.json({ message: "You don't have permission to update stock." }, { status: 403 })
    }

    const quantityDelta = Number.parseInt(String(body.quantity_delta ?? 0), 10)
    if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
      return NextResponse.json({ message: "quantity_delta is required for staff updates." }, { status: 400 })
    }

    const stockResult =
      quantityDelta > 0
        ? await incrementStock(context.supabase, productId, quantityDelta)
        : await decrementStock(context.supabase, productId, Math.abs(quantityDelta))

    if (!stockResult.ok) {
      return NextResponse.json({ message: stockResult.error ?? "Failed to update stock." }, { status: 400 })
    }

    await logStockChange(
      context.supabase,
      {
        businessOwnerId: scope.businessOwnerId,
        shopId: existing.data.shop_id,
      },
      productId,
      quantityDelta,
      `Stock adjusted by staff ${context.user.id}`
    )

    const updated = await getProductById(context.supabase, productId, scope)
    if (!updated.ok) {
      return NextResponse.json({ message: updated.message }, { status: updated.status })
    }

    return NextResponse.json(
      { product: updated.data, message: "Stock quantity updated successfully." },
      { status: 200 }
    )
  }

  const patch = normalizeProductPatch(body)
  if (!Object.keys(patch).length) {
    return NextResponse.json({ message: "No fields were provided to update." }, { status: 400 })
  }

  if (patch.name === "") {
    return NextResponse.json({ message: "Product name cannot be empty." }, { status: 400 })
  }

  if (Object.prototype.hasOwnProperty.call(patch, "quantity")) {
    const currentQuantity = toPositiveInteger(existing.data.quantity)
    const nextQuantity = toPositiveInteger(patch.quantity)
    const delta = nextQuantity - currentQuantity
    if (delta > 0) {
      await logStockChange(
        context.supabase,
        {
          businessOwnerId: scope.businessOwnerId,
          shopId: existing.data.shop_id,
        },
        productId,
        delta,
        `Stock added by business ${context.user.id}`
      )
    } else if (delta < 0) {
      await logStockChange(
        context.supabase,
        {
          businessOwnerId: scope.businessOwnerId,
          shopId: existing.data.shop_id,
        },
        productId,
        delta,
        `Stock reduced by business ${context.user.id}`
      )
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "quantity")) {
    patch.stock = patch.quantity
  }

  patch.updated_at = new Date().toISOString()

  let updateQuery = context.supabase
    .from("products")
    .update(patch)
    .eq("id", productId)

  updateQuery = applyShopScope(updateQuery, scope)

  const { data, error } = await updateQuery.select(PRODUCT_SELECT_FIELDS).single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ product: mapProductRow(data), message: "Product updated successfully." }, { status: 200 })
}

export async function DELETE(_request, { params }) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can delete products." }, { status: 403 })
  }

  const resolvedParams = await params
  const productId = resolvedParams?.id
  if (!productId) {
    return NextResponse.json({ message: "Product id is required." }, { status: 400 })
  }

  const scope = await resolveShopScope(context)
  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  const existing = await getProductById(context.supabase, productId, scope)
  if (!existing.ok) {
    return NextResponse.json({ message: existing.message }, { status: existing.status })
  }

  let deleteQuery = context.supabase
    .from("products")
    .delete()
    .eq("id", productId)

  deleteQuery = applyShopScope(deleteQuery, scope)

  const { error } = await deleteQuery
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Product deleted successfully." }, { status: 200 })
}
