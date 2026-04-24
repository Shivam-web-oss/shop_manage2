import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { calculateBillTotals, normalizeCartItem } from "@/lib/billing"
import {
  BILLING_SCHEMA_SETUP_MESSAGE,
  detectBillingSchema,
  getCustomersByIds,
  getScopedCustomerIds,
  isMissingSchemaError,
  mapLegacyBillRow,
  mapOrderRow,
} from "@/lib/billing-storage"
import { decrementStock } from "@/lib/products"
import { applyShopScope, getShopIdFromRequest, normalizeRequestedShopId, resolveShopScope } from "@/lib/shop-access"

const ORDER_LIST_SELECT_FIELDS = "id, user_id, total, created_at, updated_at, status, customer_id"
const ORDER_MUTATION_SELECT_FIELDS = "id, user_id, total, created_at, updated_at, status, customer_id"
const LEGACY_BILL_SELECT_FIELDS = "*"

async function fetchProductsByIds(supabase, productIds, scope) {
  let query = supabase
    .from("products")
    .select("id, shop_id, name, stock, quantity, price")
    .in("id", productIds)

  query = applyShopScope(query, scope)

  const { data, error } = await query

  if (error) {
    return { ok: false, message: error.message, data: [] }
  }

  return { ok: true, message: null, data: data ?? [] }
}

async function findOrCreateCustomer(supabase, scope, payload) {
  const customerName = String(payload.customer_name ?? "").trim() || "Walk-in"
  const customerPhone = String(payload.customer_phone ?? "").trim() || null
  const customerEmail = String(payload.customer_email ?? "").trim().toLowerCase() || null

  if (customerPhone) {
    const { data: existingCustomer, error: existingCustomerError } = await supabase
      .from("customers")
      .select("id, shop_id, name, phone, email")
      .eq("shop_id", scope.activeShopId)
      .eq("phone", customerPhone)
      .maybeSingle()

    if (existingCustomerError) {
      return { ok: false, message: existingCustomerError.message, customer: null, error: existingCustomerError }
    }

    if (existingCustomer) {
      const { data: updatedCustomer, error: updateError } = await supabase
        .from("customers")
        .update({
          name: customerName,
          email: customerEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCustomer.id)
        .select("id, shop_id, name, phone, email")
        .single()

      if (updateError) {
        return { ok: false, message: updateError.message, customer: null, error: updateError }
      }

      return { ok: true, message: null, customer: updatedCustomer, error: null }
    }
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      shop_id: scope.activeShopId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, shop_id, name, phone, email")
    .single()

  if (customerError || !customer) {
    return {
      ok: false,
      message: customerError?.message ?? "Unable to save customer.",
      customer: null,
      error: customerError ?? null,
    }
  }

  return { ok: true, message: null, customer, error: null }
}

function buildBillItemsPayload(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: Number((item.quantity * item.unit_price).toFixed(2)),
  }))
}

function getSchemaAwareMessage(error, fallbackMessage = BILLING_SCHEMA_SETUP_MESSAGE) {
  return isMissingSchemaError(error) ? fallbackMessage : error?.message ?? fallbackMessage
}

function getSchemaAwareStatus(error, fallbackStatus = 500) {
  return isMissingSchemaError(error) ? fallbackStatus : 400
}

async function listLegacyBills(supabase, scope, { limit, fromDate, toDate }) {
  let query = applyShopScope(supabase.from("bills").select(LEGACY_BILL_SELECT_FIELDS), scope)
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
    return { ok: false, message: getSchemaAwareMessage(error), status: getSchemaAwareStatus(error), bills: [] }
  }

  return { ok: true, message: null, status: 200, bills: (data ?? []).map(mapLegacyBillRow) }
}

async function listModernBills(supabase, scope, { limit, fromDate, toDate }) {
  const customerIdsResult = await getScopedCustomerIds(supabase, scope)
  if (!customerIdsResult.ok) {
    return {
      ok: false,
      message: getSchemaAwareMessage(customerIdsResult.error, customerIdsResult.message),
      status: getSchemaAwareStatus(customerIdsResult.error),
      bills: [],
    }
  }

  if (!customerIdsResult.ids.length) {
    return { ok: true, message: null, status: 200, bills: [] }
  }

  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT_FIELDS)
    .in("customer_id", customerIdsResult.ids)
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
    return {
      ok: false,
      message: getSchemaAwareMessage(error),
      status: getSchemaAwareStatus(error),
      bills: [],
    }
  }

  const orders = data ?? []
  const customersResult = await getCustomersByIds(
    supabase,
    scope,
    orders.map((order) => order.customer_id)
  )

  if (!customersResult.ok) {
    return {
      ok: false,
      message: getSchemaAwareMessage(customersResult.error, customersResult.message),
      status: getSchemaAwareStatus(customersResult.error),
      bills: [],
    }
  }

  return {
    ok: true,
    message: null,
    status: 200,
    bills: orders.map((order) =>
      mapOrderRow({
        ...order,
        customer: customersResult.customerMap.get(order.customer_id) ?? null,
      })
    ),
  }
}

async function createLegacyBill(supabase, scope, payload, items, totals) {
  const paymentMethod = String(payload.payment_method ?? "cash").trim().toLowerCase() || "cash"
  const status = String(payload.status ?? "paid").trim().toLowerCase() || "paid"

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      shop_id: scope.activeShopId,
      customer_name: String(payload.customer_name ?? "").trim() || "Walk-in",
      customer_phone: String(payload.customer_phone ?? "").trim() || null,
      ...totals,
      payment_method: paymentMethod,
      status,
      created_at: new Date().toISOString(),
    })
    .select(LEGACY_BILL_SELECT_FIELDS)
    .single()

  if (billError || !bill) {
    return {
      ok: false,
      message: getSchemaAwareMessage(billError, "Unable to create bill."),
      status: getSchemaAwareStatus(billError),
      bill: null,
    }
  }

  const legacyBillItems = buildBillItemsPayload(items).map((item) => ({
    bill_id: bill.id,
    ...item,
    created_at: new Date().toISOString(),
  }))

  const { error: billItemsError } = await supabase.from("bill_items").insert(legacyBillItems)
  if (billItemsError) {
    return {
      ok: false,
      message: getSchemaAwareMessage(billItemsError, "Unable to save bill items."),
      status: getSchemaAwareStatus(billItemsError),
      bill: null,
    }
  }

  return {
    ok: true,
    message: null,
    status: 201,
    bill: {
      ...mapLegacyBillRow(bill),
      items: buildBillItemsPayload(items),
    },
  }
}

export async function GET(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view bills." }, { status: 403 })
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

  const billingSchemaResult = await detectBillingSchema(context.supabase, scope)
  if (!billingSchemaResult.ok) {
    return NextResponse.json({ message: billingSchemaResult.message }, { status: billingSchemaResult.status })
  }

  const requestUrl = new URL(request.url)
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") ?? "50", 10) || 50, 1), 200)
  const fromDate = requestUrl.searchParams.get("from")
  const toDate = requestUrl.searchParams.get("to")

  if (billingSchemaResult.schema === "legacy") {
    const legacyBillsResult = await listLegacyBills(context.supabase, scope, { limit, fromDate, toDate })
    if (!legacyBillsResult.ok) {
      return NextResponse.json({ message: legacyBillsResult.message }, { status: legacyBillsResult.status })
    }

    return NextResponse.json({ bills: legacyBillsResult.bills }, { status: 200 })
  }

  const modernBillsResult = await listModernBills(context.supabase, scope, { limit, fromDate, toDate })
  if (!modernBillsResult.ok) {
    return NextResponse.json({ message: modernBillsResult.message }, { status: modernBillsResult.status })
  }

  return NextResponse.json({ bills: modernBillsResult.bills }, { status: 200 })
}

export async function POST(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to create bills." }, { status: 403 })
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

  if (context.role === ROLES.STAFF && !scope.permissions.can_create_bill) {
    return NextResponse.json({ message: "You don't have permission to create bills." }, { status: 403 })
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
  const productLookup = await fetchProductsByIds(context.supabase, productIds, scope)

  if (!productLookup.ok) {
    return NextResponse.json({ message: productLookup.message }, { status: 400 })
  }

  const productMap = new Map(productLookup.data.map((product) => [product.id, product]))
  for (const item of items) {
    const sourceProduct = productMap.get(item.product_id)
    const availableQuantity = Number(sourceProduct?.quantity ?? sourceProduct?.stock ?? 0)

    if (!sourceProduct) {
      return NextResponse.json({ message: `Product not found for item ${item.product_name}.` }, { status: 400 })
    }
    if (availableQuantity < item.quantity) {
      return NextResponse.json(
        { message: `Insufficient stock for ${sourceProduct.name}. Available: ${availableQuantity}.` },
        { status: 400 }
      )
    }
  }

  const totals = calculateBillTotals(items, body.discount_percent ?? 0, body.gst_percent ?? 18)
  const billingSchemaResult = await detectBillingSchema(context.supabase, scope)
  if (!billingSchemaResult.ok) {
    return NextResponse.json({ message: billingSchemaResult.message }, { status: billingSchemaResult.status })
  }

  let savedBill

  if (billingSchemaResult.schema === "legacy") {
    const legacyBillResult = await createLegacyBill(context.supabase, scope, body, items, totals)
    if (!legacyBillResult.ok || !legacyBillResult.bill) {
      return NextResponse.json({ message: legacyBillResult.message }, { status: legacyBillResult.status })
    }

    savedBill = legacyBillResult.bill
  } else {
    const customerResult = await findOrCreateCustomer(context.supabase, scope, body)
    if (!customerResult.ok || !customerResult.customer) {
      return NextResponse.json(
        { message: getSchemaAwareMessage(customerResult.error, customerResult.message) },
        { status: getSchemaAwareStatus(customerResult.error) }
      )
    }

    const normalizedOrderStatus = String(body.status ?? "").trim().toLowerCase()
    const orderPayload = {
      user_id: context.user.id,
      total: totals.total_amount,
      customer_id: customerResult.customer.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (normalizedOrderStatus) {
      orderPayload.status = normalizedOrderStatus
    }

    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .insert(orderPayload)
      .select(ORDER_MUTATION_SELECT_FIELDS)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { message: getSchemaAwareMessage(orderError, orderError?.message ?? "Unable to create order.") },
        { status: getSchemaAwareStatus(orderError) }
      )
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.unit_price,
    }))

    const { error: orderItemsError } = await context.supabase.from("order_items").insert(orderItems)
    if (orderItemsError) {
      return NextResponse.json(
        { message: getSchemaAwareMessage(orderItemsError, orderItemsError.message) },
        { status: getSchemaAwareStatus(orderItemsError) }
      )
    }

    savedBill = {
      ...mapOrderRow({
        ...order,
        customer: customerResult.customer,
      }),
      payment_method: String(body.payment_method ?? "").trim() || null,
      items: buildBillItemsPayload(items),
    }
  }

  for (const item of items) {
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
      bill: savedBill,
    },
    { status: 201 }
  )
}
