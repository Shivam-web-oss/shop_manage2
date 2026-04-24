import { applyShopScope } from "./shop-access"

const MISSING_SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "PGRST200", "PGRST205"])
const MISSING_SCHEMA_ERROR_FRAGMENTS = [
  "could not find the table",
  "could not find a relationship",
  "does not exist",
  "schema cache",
]

export const BILLING_SCHEMA_SETUP_MESSAGE =
  "Billing tables are not set up in Supabase yet. Run the latest billing SQL for this project, then redeploy the app."

export const CUSTOMER_SELECT_FIELDS = "id, shop_id, name, email, phone"

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function isMissingSchemaError(error) {
  const code = String(error?.code ?? "").trim()
  if (MISSING_SCHEMA_ERROR_CODES.has(code)) {
    return true
  }

  const errorText = getErrorText(error)
  return MISSING_SCHEMA_ERROR_FRAGMENTS.some((fragment) => errorText.includes(fragment))
}

export async function detectBillingSchema(supabase) {
  const modernChecks = await Promise.all([
    supabase.from("customers").select("id").limit(1),
    supabase.from("orders").select("id").limit(1),
    supabase.from("order_items").select("id").limit(1),
  ])

  const modernErrors = modernChecks.map((result) => result.error).filter(Boolean)
  if (!modernErrors.length) {
    return { ok: true, schema: "modern", status: 200, message: null }
  }

  const modernUnexpectedError = modernErrors.find((error) => !isMissingSchemaError(error))
  if (modernUnexpectedError) {
    return {
      ok: false,
      schema: null,
      status: 400,
      message: modernUnexpectedError.message ?? "Unable to inspect the billing schema.",
    }
  }

  const legacyChecks = await Promise.all([
    supabase.from("bills").select("id").limit(1),
    supabase.from("bill_items").select("id").limit(1),
  ])

  const legacyErrors = legacyChecks.map((result) => result.error).filter(Boolean)
  if (!legacyErrors.length) {
    return { ok: true, schema: "legacy", status: 200, message: null }
  }

  const legacyUnexpectedError = legacyErrors.find((error) => !isMissingSchemaError(error))
  if (legacyUnexpectedError) {
    return {
      ok: false,
      schema: null,
      status: 400,
      message: legacyUnexpectedError.message ?? "Unable to inspect the billing schema.",
    }
  }

  return {
    ok: false,
    schema: null,
    status: 500,
    message: BILLING_SCHEMA_SETUP_MESSAGE,
  }
}

export async function getScopedCustomerIds(supabase, scope) {
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

export async function getCustomersByIds(supabase, scope, customerIds) {
  const normalizedIds = [...new Set((customerIds ?? []).filter(Boolean))]
  if (!normalizedIds.length) {
    return {
      ok: true,
      message: null,
      customers: [],
      customerMap: new Map(),
    }
  }

  let query = supabase.from("customers").select(CUSTOMER_SELECT_FIELDS).in("id", normalizedIds)
  query = applyShopScope(query, scope)

  const { data, error } = await query

  if (error) {
    return {
      ok: false,
      message: error.message,
      customers: [],
      customerMap: new Map(),
      error,
    }
  }

  const customers = data ?? []

  return {
    ok: true,
    message: null,
    customers,
    customerMap: new Map(customers.map((customer) => [customer.id, customer])),
  }
}

export function mapOrderRow(order) {
  const customer = order?.customer ?? order?.customers ?? null
  const totalAmount = Number(order?.total ?? 0)

  return {
    id: order?.id ?? null,
    shop_id: customer?.shop_id ?? null,
    customer_id: order?.customer_id ?? null,
    customer_name: customer?.name ?? "Walk-in",
    customer_phone: customer?.phone ?? null,
    subtotal: totalAmount,
    discount_percent: 0,
    discount_amount: 0,
    gst_amount: 0,
    total_amount: totalAmount,
    payment_method: null,
    status: order?.status ?? "paid",
    created_at: order?.created_at ?? null,
    updated_at: order?.updated_at ?? null,
  }
}

export function mapLegacyBillRow(bill) {
  return {
    id: bill?.id ?? null,
    shop_id: bill?.shop_id ?? bill?.business_id ?? null,
    customer_id: null,
    customer_name: bill?.customer_name ?? "Walk-in",
    customer_phone: bill?.customer_phone ?? null,
    subtotal: Number(bill?.subtotal ?? bill?.total_amount ?? 0),
    discount_percent: Number(bill?.discount_percent ?? 0),
    discount_amount: Number(bill?.discount_amount ?? 0),
    gst_amount: Number(bill?.gst_amount ?? 0),
    total_amount: Number(bill?.total_amount ?? 0),
    payment_method: bill?.payment_method ?? null,
    status: bill?.status ?? "paid",
    created_at: bill?.created_at ?? null,
    updated_at: bill?.updated_at ?? bill?.created_at ?? null,
  }
}
