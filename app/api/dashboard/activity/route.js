import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { detectBillingSchema, isMissingSchemaError, mapLegacyBillRow, mapOrderRow } from "@/lib/billing-storage"
import { applyShopScope, getShopIdFromRequest, resolveShopScope } from "@/lib/shop-access"

const ORDER_ACTIVITY_SELECT_FIELDS = "id, total, created_at, updated_at, status, customer_id, customers(id, shop_id, name, phone)"
const LEGACY_BILL_ACTIVITY_SELECT_FIELDS =
  "id, shop_id, customer_name, customer_phone, subtotal, discount_percent, discount_amount, gst_amount, total_amount, payment_method, status, created_at"

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function toIso(value) {
  const dateValue = new Date(value)
  return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString()
}

function compareByTimeDesc(a, b) {
  const aTime = toIso(a.timestamp)
  const bTime = toIso(b.timestamp)
  if (!aTime && !bTime) return 0
  if (!aTime) return 1
  if (!bTime) return -1
  return aTime > bTime ? -1 : 1
}

function getSchemaAwareMessage(error) {
  return isMissingSchemaError(error)
    ? "Billing data is not fully set up in Supabase yet. Run the latest billing SQL for this project and redeploy."
    : error?.message ?? "Unable to load dashboard activity."
}

async function getScopedCustomerIds(supabase, scope) {
  let query = supabase.from("customers").select("id, shop_id")
  query = applyShopScope(query, scope)

  const { data, error } = await query

  if (error) {
    return { ok: false, message: error.message, ids: [], error }
  }

  return {
    ok: true,
    message: null,
    ids: (data ?? []).map((customer) => customer.id).filter(Boolean),
  }
}

function buildBillActivities(bills, schema) {
  return bills.map((bill) => {
    const paymentMethod = bill.payment_method ? ` via ${bill.payment_method}` : ""
    return {
      id: `${schema === "modern" ? "order" : "bill"}-${bill.id}`,
      type: schema === "modern" ? "order" : "bill",
      title: `${schema === "modern" ? "Order" : "Bill"} created for ${bill.customer_name || "Walk-in"}`,
      description: `Amount Rs.${Number(bill.total_amount ?? 0).toFixed(2)}${paymentMethod}`,
      timestamp: bill.created_at,
    }
  })
}

export async function GET(request) {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view activity." }, { status: 403 })
  }

  const scope = await resolveShopScope(context, {
    requestedShopId: getShopIdFromRequest(request),
  })

  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  if (context.role === ROLES.STAFF && !scope.permissions.can_view_reports) {
    return NextResponse.json({ message: "You don't have permission to view reports." }, { status: 403 })
  }

  const requestUrl = new URL(request.url)
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") ?? "20", 10) || 20, 1), 200)
  const dayStartIso = startOfToday()
  const billingSchemaResult = await detectBillingSchema(context.supabase, scope)

  if (!billingSchemaResult.ok) {
    return NextResponse.json({ message: billingSchemaResult.message }, { status: billingSchemaResult.status })
  }

  const productsQuery = applyShopScope(
    context.supabase.from("products").select("id, name, stock, quantity, updated_at", { count: "exact" }),
    scope
  )

  let salesPromise
  if (billingSchemaResult.schema === "modern") {
    const customerIdsResult = await getScopedCustomerIds(context.supabase, scope)
    if (!customerIdsResult.ok) {
      return NextResponse.json({ message: getSchemaAwareMessage(customerIdsResult.error) }, { status: 400 })
    }

    salesPromise = customerIdsResult.ids.length
      ? context.supabase
          .from("orders")
          .select(ORDER_ACTIVITY_SELECT_FIELDS, { count: "exact" })
          .in("customer_id", customerIdsResult.ids)
          .order("created_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [], error: null, count: 0 })
  } else {
    salesPromise = applyShopScope(
      context.supabase.from("bills").select(LEGACY_BILL_ACTIVITY_SELECT_FIELDS, { count: "exact" }),
      scope
    )
      .order("created_at", { ascending: false })
      .limit(limit)
  }

  const [productsResult, salesResult] = await Promise.all([productsQuery, salesPromise])

  if (productsResult.error) {
    return NextResponse.json({ message: productsResult.error.message }, { status: 400 })
  }
  if (salesResult.error) {
    return NextResponse.json({ message: getSchemaAwareMessage(salesResult.error) }, { status: 400 })
  }

  let staffCount = 0
  const { count: staffPermissionCount, error: staffError } = await context.supabase
    .from("staff_permissions")
    .select("id", { count: "exact", head: true })
    .eq("business_owner_id", scope.businessOwnerId)

  if (!staffError && typeof staffPermissionCount === "number") {
    staffCount = staffPermissionCount
  }

  const mappedSales =
    billingSchemaResult.schema === "modern"
      ? (salesResult.data ?? []).map(mapOrderRow)
      : (salesResult.data ?? []).map(mapLegacyBillRow)

  const salesToday = mappedSales.filter((bill) => (bill.created_at ?? "") >= dayStartIso)
  const revenueToday = salesToday.reduce((sum, bill) => sum + Number(bill.total_amount ?? 0), 0)
  const lowStockCount = (productsResult.data ?? []).filter((product) => {
    const quantity = Number(product.quantity ?? product.stock ?? 0)
    return quantity <= 5
  }).length

  const billActivities = buildBillActivities(mappedSales, billingSchemaResult.schema)

  const productActivities = (productsResult.data ?? [])
    .filter((product) => product.updated_at)
    .sort((a, b) => compareByTimeDesc({ timestamp: a.updated_at }, { timestamp: b.updated_at }))
    .slice(0, limit)
    .map((product) => ({
      id: `product-${product.id}`,
      type: "stock",
      title: `${product.name || "Product"} updated`,
      description: `Current stock ${Number(product.quantity ?? product.stock ?? 0)}`,
      timestamp: product.updated_at,
    }))

  const activities = [...billActivities, ...productActivities].sort(compareByTimeDesc).slice(0, limit)

  return NextResponse.json(
    {
      metrics: {
        shops_count: scope.activeShopId ? 1 : scope.accessibleShopIds.length,
        products_count: productsResult.count ?? 0,
        staff_count: staffCount,
        bills_today: salesToday.length,
        revenue_today: Number(revenueToday.toFixed(2)),
        low_stock_count: lowStockCount,
      },
      activities,
      latest_bills: mappedSales,
      latest_stock_logs: productActivities,
    },
    { status: 200 }
  )
}
