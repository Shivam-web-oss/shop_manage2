import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { calculateBillTotals, normalizeCartItem } from "@/lib/billing"
import { decrementStock } from "@/lib/products"
import { DEFAULT_STAFF_PERMISSIONS, mapPermissionsFromRow } from "@/lib/staff-permissions"

const ALLOWED_PAYMENT_METHODS = new Set(["cash", "upi", "card", "credit"])

async function getStaffPermissions(supabase, staffUserId) {
  const { data, error } = await supabase
    .from("staff_permissions")
    .select("can_create_bill, can_update_stock, can_view_reports")
    .eq("staff_user_id", staffUserId)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01") {
      return { ...DEFAULT_STAFF_PERMISSIONS }
    }
    return { ...DEFAULT_STAFF_PERMISSIONS }
  }

  return mapPermissionsFromRow(data)
}

async function fetchProductsByIds(supabase, productIds) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, quantity, price")
    .in("id", productIds)

  if (error) {
    return { ok: false, message: error.message, data: [] }
  }

  return { ok: true, message: null, data: data ?? [] }
}

export async function GET(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view bills." }, { status: 403 })
  }

  if (context.role === ROLES.STAFF) {
    const permissions = await getStaffPermissions(context.supabase, context.user.id)
    if (!permissions.can_view_reports) {
      return NextResponse.json({ message: "You don't have permission to view reports." }, { status: 403 })
    }
  }

  const requestUrl = new URL(request.url)
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") ?? "50", 10) || 50, 1), 200)
  const fromDate = requestUrl.searchParams.get("from")
  const toDate = requestUrl.searchParams.get("to")

  let query = context.supabase
    .from("bills")
    .select("id, customer_name, customer_phone, subtotal, discount_percent, discount_amount, gst_amount, total_amount, payment_method, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (fromDate) {
    query = query.gte("created_at", fromDate)
  }

  if (toDate) {
    query = query.lte("created_at", toDate)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ bills: data ?? [] }, { status: 200 })
}

export async function POST(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to create bills." }, { status: 403 })
  }

  if (context.role === ROLES.STAFF) {
    const permissions = await getStaffPermissions(context.supabase, context.user.id)
    if (!permissions.can_create_bill) {
      return NextResponse.json({ message: "You don't have permission to create bills." }, { status: 403 })
    }
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const rawItems = Array.isArray(body.items) ? body.items : []
  if (!rawItems.length) {
    return NextResponse.json({ message: "At least one item is required." }, { status: 400 })
  }

  const items = rawItems
    .map((item) => normalizeCartItem(item))
    .filter((item) => item.product_id && item.product_name && item.quantity > 0)

  if (!items.length) {
    return NextResponse.json({ message: "Please add valid items before creating a bill." }, { status: 400 })
  }

  const productIds = [...new Set(items.map((item) => item.product_id))]
  const productLookup = await fetchProductsByIds(context.supabase, productIds)

  if (!productLookup.ok) {
    return NextResponse.json({ message: productLookup.message }, { status: 400 })
  }

  const productMap = new Map(productLookup.data.map((product) => [product.id, product]))
  for (const item of items) {
    const sourceProduct = productMap.get(item.product_id)
    if (!sourceProduct) {
      return NextResponse.json({ message: `Product not found for item ${item.product_name}.` }, { status: 400 })
    }
    if ((sourceProduct.quantity ?? 0) < item.quantity) {
      return NextResponse.json(
        { message: `Insufficient stock for ${sourceProduct.name}. Available: ${sourceProduct.quantity ?? 0}.` },
        { status: 400 }
      )
    }
  }

  const paymentMethod = String(body.payment_method ?? "cash").toLowerCase()
  if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
    return NextResponse.json({ message: "Invalid payment method." }, { status: 400 })
  }

  const totals = calculateBillTotals(items, body.discount_percent ?? 0, body.gst_percent ?? 18)
  const customerName = String(body.customer_name ?? "").trim() || "Walk-in"
  const customerPhone = String(body.customer_phone ?? "").trim() || null

  const { data: bill, error: billError } = await context.supabase
    .from("bills")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      ...totals,
      payment_method: paymentMethod,
      status: "paid",
      created_at: new Date().toISOString(),
    })
    .select("id, customer_name, customer_phone, subtotal, discount_percent, discount_amount, gst_amount, total_amount, payment_method, status, created_at")
    .single()

  if (billError || !bill) {
    return NextResponse.json({ message: billError?.message ?? "Unable to create bill." }, { status: 400 })
  }

  const billItems = items.map((item) => ({
    bill_id: bill.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: Number((item.quantity * item.unit_price).toFixed(2)),
    created_at: new Date().toISOString(),
  }))

  const { error: billItemsError } = await context.supabase.from("bill_items").insert(billItems)
  if (billItemsError) {
    return NextResponse.json({ message: billItemsError.message }, { status: 400 })
  }

  for (const item of billItems) {
    const stockResult = await decrementStock(context.supabase, item.product_id, item.quantity)
    if (!stockResult.ok) {
      return NextResponse.json(
        { message: stockResult.error ?? `Unable to decrement stock for ${item.product_name}.` },
        { status: 400 }
      )
    }
  }

  return NextResponse.json(
    {
      message: "Bill created successfully.",
      bill: {
        ...bill,
        items: billItems,
      },
    },
    { status: 201 }
  )
}
