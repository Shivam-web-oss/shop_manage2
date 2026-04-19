import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { DEFAULT_STAFF_PERMISSIONS, mapPermissionsFromRow } from "@/lib/staff-permissions"

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

export async function GET(request) {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view activity." }, { status: 403 })
  }

  if (context.role === ROLES.STAFF) {
    const permissions = await getStaffPermissions(context.supabase, context.user.id)
    if (!permissions.can_view_reports) {
      return NextResponse.json({ message: "You don't have permission to view reports." }, { status: 403 })
    }
  }

  const requestUrl = new URL(request.url)
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") ?? "20", 10) || 20, 1), 200)
  const dayStartIso = startOfToday()

  const [productsResult, billsResult, stockLogsResult, shopsResult] = await Promise.all([
    context.supabase.from("products").select("id, quantity", { count: "exact" }),
    context.supabase
      .from("bills")
      .select("id, customer_name, total_amount, payment_method, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit),
    context.supabase
      .from("stock_logs")
      .select("id, product_id, quantity_added, updated_at, products(name)")
      .order("updated_at", { ascending: false })
      .limit(limit),
    context.supabase.from("business").select("id", { count: "exact" }).eq("user_id", context.user.id),
  ])

  if (productsResult.error) {
    return NextResponse.json({ message: productsResult.error.message }, { status: 400 })
  }
  if (billsResult.error) {
    return NextResponse.json({ message: billsResult.error.message }, { status: 400 })
  }
  if (stockLogsResult.error) {
    return NextResponse.json({ message: stockLogsResult.error.message }, { status: 400 })
  }
  if (shopsResult.error) {
    return NextResponse.json({ message: shopsResult.error.message }, { status: 400 })
  }

  let staffCount = 0
  const { count: staffPermissionCount, error: staffError } = await context.supabase
    .from("staff_permissions")
    .select("id", { count: "exact", head: true })
    .eq("business_owner_id", context.user.id)

  if (!staffError && typeof staffPermissionCount === "number") {
    staffCount = staffPermissionCount
  } else {
    const { count: profileStaffCount } = await context.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", ROLES.STAFF)
    staffCount = profileStaffCount ?? 0
  }

  const billsToday = (billsResult.data ?? []).filter((bill) => (bill.created_at ?? "") >= dayStartIso)
  const revenueToday = billsToday.reduce((sum, bill) => sum + Number(bill.total_amount ?? 0), 0)
  const lowStockCount = (productsResult.data ?? []).filter((product) => Number(product.quantity ?? 0) <= 5).length

  const billActivities = (billsResult.data ?? []).map((bill) => ({
    id: `bill-${bill.id}`,
    type: "bill",
    title: `Bill created for ${bill.customer_name || "Walk-in"}`,
    description: `Amount ₹${Number(bill.total_amount ?? 0).toFixed(2)} via ${bill.payment_method || "cash"}`,
    timestamp: bill.created_at,
  }))

  const stockActivities = (stockLogsResult.data ?? []).map((log) => ({
    id: `stock-${log.id}`,
    type: "stock",
    title: `${log.products?.name || "Product"} stock changed`,
    description: `${Number(log.quantity_added ?? 0) >= 0 ? "+" : ""}${Number(log.quantity_added ?? 0)} units`,
    timestamp: log.updated_at,
  }))

  const activities = [...billActivities, ...stockActivities].sort(compareByTimeDesc).slice(0, limit)

  return NextResponse.json(
    {
      metrics: {
        shops_count: shopsResult.count ?? 0,
        products_count: productsResult.count ?? 0,
        staff_count: staffCount,
        bills_today: billsToday.length,
        revenue_today: Number(revenueToday.toFixed(2)),
        low_stock_count: lowStockCount,
      },
      activities,
      latest_bills: billsResult.data ?? [],
      latest_stock_logs: stockLogsResult.data ?? [],
    },
    { status: 200 }
  )
}
