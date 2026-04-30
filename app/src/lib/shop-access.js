/**
 * BEGINNER NOTES
 * File: app/src/lib/shop-access.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { ROLES } from "./authz"
import { DENIED_STAFF_PERMISSIONS, mapPermissionsFromRow } from "./staff-permissions"

// Columns we read from the `business` table when listing/reading shops.
const SHOP_SELECT_FIELDS = "id, user_id, company_name, shop_name, location, description, created_at"
// Columns we read from the `staff_permissions` table when checking staff access.
const STAFF_ACCESS_FIELDS = "staff_user_id, business_owner_id, can_create_bill, can_update_stock, can_view_reports"
// A UUID that should never match real data; used to force "no results" queries safely.
const EMPTY_SCOPE_UUID = "00000000-0000-0000-0000-000000000000"

const SHOP_ACCESS_TABLE_SETUP_MESSAGE =
  "Staff access or shop schema is missing. Make sure the business and staff_permissions tables match your Supabase schema."

function toTrimmedString(value) {
  const normalizedValue = String(value ?? "").trim()
  return normalizedValue || null
}

function buildFailure(status, message, extras = {}) {
  return {
    ok: false,
    status,
    message,
    ...extras,
  }
}

export function normalizeRequestedShopId(...values) {
  // Picks the first non-empty shop id from several possible sources.
  for (const value of values) {
    const normalizedValue = toTrimmedString(value)
    if (normalizedValue) {
      return normalizedValue
    }
  }

  return null
}

export function getShopIdFromRequest(request) {
  // Helper for API routes: reads `?shopId=...` from the URL.
  if (!request?.url) {
    return null
  }

  return toTrimmedString(new URL(request.url).searchParams.get("shopId"))
}

export async function listOwnedShops(supabase, businessOwnerId) {
  // Lists shops for a business owner.
  // Data source: `business` table filtered by `user_id` (owner id).
  const { data, error } = await supabase
    .from("business")
    .select(SHOP_SELECT_FIELDS)
    .eq("user_id", businessOwnerId)
    .order("created_at", { ascending: true })

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return buildFailure(500, SHOP_ACCESS_TABLE_SETUP_MESSAGE, { shops: [] })
    }

    return buildFailure(400, error.message, { shops: [] })
  }

  return {
    ok: true,
    status: 200,
    message: null,
    shops: data ?? [],
  }
}

export async function findOwnedShop(supabase, businessOwnerId, shopId) {
  // Finds a single shop owned by the given owner.
  // Why: prevents accessing another owner's shop by guessing IDs.
  const normalizedShopId = toTrimmedString(shopId)

  if (!normalizedShopId) {
    return buildFailure(400, "Shop id is required.", { shop: null })
  }

  const { data, error } = await supabase
    .from("business")
    .select(SHOP_SELECT_FIELDS)
    .eq("id", normalizedShopId)
    .eq("user_id", businessOwnerId)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return buildFailure(500, SHOP_ACCESS_TABLE_SETUP_MESSAGE, { shop: null })
    }

    return buildFailure(400, error.message, { shop: null })
  }

  if (!data) {
    return buildFailure(404, "Shop not found.", { shop: null })
  }

  return {
    ok: true,
    status: 200,
    message: null,
    shop: data,
  }
}

export async function getStaffAccessRow(supabase, staffUserId) {
  // Loads staff permissions (what a staff user is allowed to do).
  // Data source: `staff_permissions` table (one row per staff user).
  const { data, error } = await supabase
    .from("staff_permissions")
    .select(STAFF_ACCESS_FIELDS)
    .eq("staff_user_id", staffUserId)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return buildFailure(500, SHOP_ACCESS_TABLE_SETUP_MESSAGE, {
        access: null,
        permissions: { ...DENIED_STAFF_PERMISSIONS },
      })
    }

    return buildFailure(400, error.message, {
      access: null,
      permissions: { ...DENIED_STAFF_PERMISSIONS },
    })
  }

  if (!data) {
    return buildFailure(403, "No staff access is configured for this account.", {
      access: null,
      permissions: { ...DENIED_STAFF_PERMISSIONS },
    })
  }

  return {
    ok: true,
    status: 200,
    message: null,
    access: data,
    permissions: mapPermissionsFromRow(data),
  }
}

function buildScopeResponse({ context, businessOwnerId, accessibleShops, activeShop, permissions, shopLocked, staffAccess }) {
  const accessibleShopIds = accessibleShops.map((shop) => shop.id)
  const scopedShopIds = activeShop ? [activeShop.id] : accessibleShopIds

  return {
    ok: true,
    status: 200,
    message: null,
    role: context.role,
    user: context.user,
    businessOwnerId,
    accessibleShops,
    accessibleShopIds,
    activeShop,
    activeShopId: activeShop?.id ?? null,
    scopedShopIds,
    shopLocked,
    permissions,
    staffAccess,
  }
}

function buildEmptyScope(status, message, extras = {}) {
  return buildFailure(status, message, {
    accessibleShops: [],
    accessibleShopIds: [],
    activeShop: null,
    activeShopId: null,
    scopedShopIds: [],
    shopLocked: false,
    permissions: { ...DENIED_STAFF_PERMISSIONS },
    staffAccess: null,
    businessOwnerId: null,
    ...extras,
  })
}

export function serializeShopScope(scope) {
  // Converts the scope object into a small JSON-friendly shape for client components.
  if (!scope?.ok) {
    return {
      shops: [],
      active_shop_id: null,
      shop_locked: false,
    }
  }

  return {
    shops: scope.accessibleShops.map((shop) => ({
      id: shop.id,
      company_name: shop.company_name,
      shop_name: shop.shop_name,
      location: shop.location,
      description: shop.description,
      created_at: shop.created_at,
    })),
    active_shop_id: scope.activeShopId,
    shop_locked: scope.shopLocked,
  }
}

export function applyShopScope(query, scope, columnName = "shop_id") {
  // Applies shop scoping to a Supabase query so staff only sees allowed shop data.
  if (!scope?.scopedShopIds?.length) {
    return query.eq(columnName, EMPTY_SCOPE_UUID)
  }

  if (scope.scopedShopIds.length === 1) {
    return query.eq(columnName, scope.scopedShopIds[0])
  }

  return query.in(columnName, scope.scopedShopIds)
}

function resolveActiveShop(accessibleShops, requestedShopId, { requireActiveShop, defaultToFirstShop, role, permissions, staffAccess, businessOwnerId }) {
  let activeShop = null

  if (requestedShopId) {
    activeShop = accessibleShops.find((shop) => shop.id === requestedShopId) ?? null
    if (!activeShop) {
      return buildFailure(403, "You do not have access to that shop.", {
        accessibleShops,
        accessibleShopIds: accessibleShops.map((shop) => shop.id),
        activeShop: null,
        activeShopId: null,
        scopedShopIds: [],
        shopLocked: false,
        permissions,
        staffAccess,
        businessOwnerId,
        role,
      })
    }
  } else if (accessibleShops.length === 1 || defaultToFirstShop) {
    activeShop = accessibleShops[0] ?? null
  }

  if (requireActiveShop && !activeShop) {
    return buildFailure(
      accessibleShops.length ? 400 : 404,
      accessibleShops.length ? "Shop selection is required." : "Create a shop first before managing products.",
      {
        accessibleShops,
        accessibleShopIds: accessibleShops.map((shop) => shop.id),
        activeShop: null,
        activeShopId: null,
        scopedShopIds: [],
        shopLocked: false,
        permissions,
        staffAccess,
        businessOwnerId,
        role,
      }
    )
  }

  return {
    ok: true,
    activeShop,
  }
}

export async function resolveShopScope(context, options = {}) {
  // Main entrypoint: decides which shops the current user can access.
  // Data sources:
  // - `business` table (shops)
  // - `staff_permissions` table (staff access)
  // Inputs:
  // - `context` comes from auth helpers (`requireAuth` / `getAuthContext`)
  // - `options.requestedShopId` can come from UI or `?shopId=...`
  const requestedShopId = normalizeRequestedShopId(options.requestedShopId)
  const requireActiveShop = options.requireActiveShop === true
  const defaultToFirstShop = options.defaultToFirstShop === true

  if (!context?.supabase || !context?.user) {
    return buildEmptyScope(401, "Authentication required.")
  }

  if (context.role === ROLES.BUSINESS) {
    const ownedShopsResult = await listOwnedShops(context.supabase, context.user.id)
    if (!ownedShopsResult.ok) {
      return {
        ...buildEmptyScope(ownedShopsResult.status, ownedShopsResult.message, { businessOwnerId: context.user.id }),
        ...ownedShopsResult,
      }
    }

    const activeShopResult = resolveActiveShop(ownedShopsResult.shops, requestedShopId, {
      requireActiveShop,
      defaultToFirstShop,
      role: context.role,
      permissions: { ...DENIED_STAFF_PERMISSIONS },
      staffAccess: null,
      businessOwnerId: context.user.id,
    })

    if (!activeShopResult.ok) {
      return activeShopResult
    }

    return buildScopeResponse({
      context,
      businessOwnerId: context.user.id,
      accessibleShops: ownedShopsResult.shops,
      activeShop: activeShopResult.activeShop,
      permissions: { ...DENIED_STAFF_PERMISSIONS },
      shopLocked: false,
      staffAccess: null,
    })
  }

  if (context.role !== ROLES.STAFF) {
    return buildEmptyScope(403, "You are not allowed to access shop data.")
  }

  const staffAccessResult = await getStaffAccessRow(context.supabase, context.user.id)
  if (!staffAccessResult.ok) {
    return {
      ...buildEmptyScope(staffAccessResult.status, staffAccessResult.message, {
        businessOwnerId: staffAccessResult.access?.business_owner_id ?? null,
      }),
      ...staffAccessResult,
    }
  }

  const { access, permissions } = staffAccessResult
  const businessOwnerId = access.business_owner_id

  const ownedShopsResult = await listOwnedShops(context.supabase, businessOwnerId)
  if (!ownedShopsResult.ok) {
    return {
      ...buildEmptyScope(ownedShopsResult.status, ownedShopsResult.message, {
        businessOwnerId,
        permissions,
        staffAccess: access,
      }),
      ...ownedShopsResult,
    }
  }

  const activeShopResult = resolveActiveShop(ownedShopsResult.shops, requestedShopId, {
    requireActiveShop,
    defaultToFirstShop,
    role: context.role,
    permissions,
    staffAccess: access,
    businessOwnerId,
  })

  if (!activeShopResult.ok) {
    return activeShopResult
  }

  return buildScopeResponse({
    context,
    businessOwnerId,
    accessibleShops: ownedShopsResult.shops,
    activeShop: activeShopResult.activeShop,
    permissions,
    shopLocked: false,
    staffAccess: access,
  })
}
