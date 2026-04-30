/**
 * BEGINNER NOTES
 * File: app/api/bills/route.js
 * Purpose: Server API endpoint (HTTP route).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

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

// Fields used when listing saved orders in the newer billing schema.
const ORDER_LIST_SELECT_FIELDS = "id, user_id, total, created_at, updated_at, status, customer_id"
// Fields returned immediately after creating a new order row.
const ORDER_MUTATION_SELECT_FIELDS = "id, user_id, total, created_at, updated_at, status, customer_id"
// Legacy bills still read the full row shape from the older table.
const LEGACY_BILL_SELECT_FIELDS = "*"

// Load the exact product rows needed for this bill and keep them limited to the allowed shop scope.
async function fetchProductsByIds(supabase, productIds, scope) {
  // Start a product query for the requested ids only.
  let query = supabase
    .from("products")
    .select("id, shop_id, name, stock, quantity, price")
    .in("id", productIds)

  // Add shop filtering so users cannot read products from another shop.
  query = applyShopScope(query, scope)

  const { data, error } = await query

  // Return a predictable result object even when the query fails.
  if (error) {
    return { ok: false, message: error.message, data: [] }
  }

  return { ok: true, message: null, data: data ?? [] }
}

// Reuse a customer when the phone number already exists, otherwise create a new customer row.
async function findOrCreateCustomer(supabase, scope, payload) {
  // Normalize incoming customer values from the request body.
  const customerName = String(payload.customer_name ?? "").trim() || "Walk-in"
  const customerPhone = String(payload.customer_phone ?? "").trim() || null
  const customerEmail = String(payload.customer_email ?? "").trim().toLowerCase() || null

  // Phone number is used as the simplest duplicate check for existing customers.
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

    // If a customer already exists, update the saved name/email with the latest values.
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

  // No customer matched, so create a brand-new customer row for this shop.
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

// Convert cart items into the shape stored with bills/orders.
function buildBillItemsPayload(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: Number((item.quantity * item.unit_price).toFixed(2)),
  }))
}

// Missing-schema errors should explain setup problems clearly; other errors use their direct message.
function getSchemaAwareMessage(error, fallbackMessage = BILLING_SCHEMA_SETUP_MESSAGE) {
  return isMissingSchemaError(error) ? fallbackMessage : error?.message ?? fallbackMessage
}

// Missing-schema issues are usually treated as server/setup errors, while others are request errors.
function getSchemaAwareStatus(error, fallbackStatus = 500) {
  return isMissingSchemaError(error) ? fallbackStatus : 400
}

// Read bills from the older `bills` table format.
async function listLegacyBills(supabase, scope, { limit, fromDate, toDate }) {
  // Start with the shop-scoped legacy bill query.
  let query = applyShopScope(supabase.from("bills").select(LEGACY_BILL_SELECT_FIELDS), scope)
    .order("created_at", { ascending: false })
    .limit(limit)

  // Add optional date filters only when the request provides them.
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

  // Convert raw database rows into the bill shape the UI expects.
  return { ok: true, message: null, status: 200, bills: (data ?? []).map(mapLegacyBillRow) }
}

// Read bills from the newer orders/customers schema and reshape them into bill objects.
async function listModernBills(supabase, scope, { limit, fromDate, toDate }) {
  // Find which customers belong to the active shop first.
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

  // Load orders that belong to those allowed customers.
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

  // Customer rows are needed because the bill UI shows customer details.
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

  // Merge each order with its matching customer and map it into one bill-shaped object.
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

// Save a bill using the legacy `bills` + `bill_items` tables.
async function createLegacyBill(supabase, scope, payload, items, totals) {
  // Normalize free-text fields before storing them.
  const paymentMethod = String(payload.payment_method ?? "cash").trim().toLowerCase() || "cash"
  const status = String(payload.status ?? "paid").trim().toLowerCase() || "paid"

  // Insert the main bill row first.
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

  // Create one bill_items row per billed product.
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

  // Return one combined bill object so the frontend can preview/print it immediately.
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

// GET returns a list of bills for the current user and current shop scope.
export async function GET(request) {
  // Auth context includes the logged-in user, role, Supabase client, and status.
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  // Only business users and staff can view bills.
  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to view bills." }, { status: 403 })
  }

  // Resolve which shop this request is allowed to access.
  const scope = await resolveShopScope(context, {
    requestedShopId: getShopIdFromRequest(request),
  })

  if (!scope.ok) {
    return NextResponse.json({ message: scope.message }, { status: scope.status })
  }

  if (context.role === ROLES.STAFF && !scope.permissions.can_view_reports) {
    return NextResponse.json({ message: "You don't have permission to view reports." }, { status: 403 })
  }

  // Detect whether the project is still on the legacy bill schema or the newer order schema.
  const billingSchemaResult = await detectBillingSchema(context.supabase, scope)
  if (!billingSchemaResult.ok) {
    return NextResponse.json({ message: billingSchemaResult.message }, { status: billingSchemaResult.status })
  }

  // Read optional filters from the URL query string.
  const requestUrl = new URL(request.url)
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") ?? "50", 10) || 50, 1), 200)
  const fromDate = requestUrl.searchParams.get("from")
  const toDate = requestUrl.searchParams.get("to")

  // Choose the correct listing flow based on the detected schema.
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

// POST validates the request, creates the bill/order, and finally decrements stock.
export async function POST(request) {
  const context = await getApiAuthContext()

  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  // Only business users and staff can create bills.
  if (!hasAnyRole(context.role, [ROLES.BUSINESS, ROLES.STAFF])) {
    return NextResponse.json({ message: "You are not allowed to create bills." }, { status: 403 })
  }

  // Parse the JSON body sent from the billing form.
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  // Resolve which shop the new bill should belong to.
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

  // Start from the raw incoming items array.
  const rawItems = Array.isArray(body.items) ? body.items : []
  if (!rawItems.length) {
    return NextResponse.json({ message: "At least one item is required." }, { status: 400 })
  }

  // Normalize each incoming line item and drop incomplete or invalid rows.
  const items = rawItems
    .map((item) => normalizeCartItem(item))
    .filter((item) => item.product_id && item.product_name && item.quantity > 0)

  if (!items.length) {
    return NextResponse.json({ message: "Please add valid items before creating a bill." }, { status: 400 })
  }

  // Fetch product rows once so we can validate stock before saving anything.
  const productIds = [...new Set(items.map((item) => item.product_id))]
  const productLookup = await fetchProductsByIds(context.supabase, productIds, scope)

  if (!productLookup.ok) {
    return NextResponse.json({ message: productLookup.message }, { status: 400 })
  }

  // A map makes product lookups by id fast while checking each bill item.
  const productMap = new Map(productLookup.data.map((product) => [product.id, product]))

  // Stop early if any requested item is missing or out of stock.
  for (const item of items) {
    // `sourceProduct` is the latest saved version of the product row.
    const sourceProduct = productMap.get(item.product_id)
    // Support schemas that use either `quantity` or `stock` as the stock column.
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

  // Calculate the final bill totals from the validated items.
  const totals = calculateBillTotals(items, body.discount_percent ?? 0, body.gst_percent ?? 18)

  // Decide which database schema flow this project is using.
  const billingSchemaResult = await detectBillingSchema(context.supabase, scope)
  if (!billingSchemaResult.ok) {
    return NextResponse.json({ message: billingSchemaResult.message }, { status: billingSchemaResult.status })
  }

  // This will store the final bill object returned to the frontend.
  let savedBill

  if (billingSchemaResult.schema === "legacy") {
    // Older projects save into `bills` and `bill_items`.
    const legacyBillResult = await createLegacyBill(context.supabase, scope, body, items, totals)
    if (!legacyBillResult.ok || !legacyBillResult.bill) {
      return NextResponse.json({ message: legacyBillResult.message }, { status: legacyBillResult.status })
    }

    savedBill = legacyBillResult.bill
  } else {
    // Newer projects save an order linked to a customer.
    const customerResult = await findOrCreateCustomer(context.supabase, scope, body)
    if (!customerResult.ok || !customerResult.customer) {
      return NextResponse.json(
        { message: getSchemaAwareMessage(customerResult.error, customerResult.message) },
        { status: getSchemaAwareStatus(customerResult.error) }
      )
    }

    // Status is optional, so normalize it and add it only when present.
    const normalizedOrderStatus = String(body.status ?? "").trim().toLowerCase()

    // Build the main order row payload.
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

    // Save the main order row.
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

    // Save each billed product as an order_items row.
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

    // Convert the order-based data back into the same bill shape used by the frontend.
    savedBill = {
      ...mapOrderRow({
        ...order,
        customer: customerResult.customer,
      }),
      shop_id: scope.activeShopId,
      subtotal: totals.subtotal,
      discount_percent: totals.discount_percent,
      discount_amount: totals.discount_amount,
      gst_amount: totals.gst_amount,
      total_amount: totals.total_amount,
      payment_method: String(body.payment_method ?? "").trim() || null,
      items: buildBillItemsPayload(items),
    }
  }

  // After saving the bill, reduce stock for every sold product.
  for (const item of items) {
    const stockResult = await decrementStock(context.supabase, item.product_id, item.quantity)
    if (!stockResult.ok) {
      return NextResponse.json(
        { message: stockResult.error ?? `Unable to decrement stock for ${item.product_name}.` },
        { status: 400 }
      )
    }
  }

  // Return the created bill so the UI can preview and print it immediately.
  return NextResponse.json(
    {
      message: "Bill created successfully.",
      bill: savedBill,
    },
    { status: 201 }
  )
}
