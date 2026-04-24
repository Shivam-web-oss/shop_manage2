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

export async function detectBillingSchema(supabase, scope) {
  const modernChecks = await Promise.all([
    applyShopScope(supabase.from("customers").select("id, shop_id"), scope).limit(1),
    supabase
      .from("orders")
      .select("id, customer_id, total, status, created_at, updated_at, customers(id, shop_id)")
      .limit(1),
    supabase.from("order_items").select("id, order_id, product_id, quantity, price").limit(1),
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
    applyShopScope(supabase.from("bills").select("id, shop_id, total_amount, status, created_at"), scope).limit(1),
    supabase.from("bill_items").select("id, bill_id, product_id, quantity, unit_price, total_price").limit(1),
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

export function mapOrderRow(order) {
  const customer = order?.customers ?? null
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
    shop_id: bill?.shop_id ?? null,
    customer_id: null,
    customer_name: bill?.customer_name ?? "Walk-in",
    customer_phone: bill?.customer_phone ?? null,
    subtotal: Number(bill?.subtotal ?? 0),
    discount_percent: Number(bill?.discount_percent ?? 0),
    discount_amount: Number(bill?.discount_amount ?? 0),
    gst_amount: Number(bill?.gst_amount ?? 0),
    total_amount: Number(bill?.total_amount ?? 0),
    payment_method: bill?.payment_method ?? null,
    status: bill?.status ?? "paid",
    created_at: bill?.created_at ?? null,
    updated_at: bill?.created_at ?? null,
  }
}
