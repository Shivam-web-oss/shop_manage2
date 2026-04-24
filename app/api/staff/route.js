import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeStaffPermissions } from "@/lib/staff-permissions"
import { findOwnedShop, listOwnedShops, normalizeRequestedShopId } from "@/lib/shop-access"

const TABLE_SETUP_MESSAGE =
  "Staff access table is missing. Run the SQL in sql/staff-permissions.sql and sql/add-shop-scope.sql and try again."

async function readStaffAccessRows(adminClient, businessOwnerId) {
  const { data, error } = await adminClient
    .from("staff_permissions")
    .select(
      "id, staff_user_id, business_owner_id, assigned_shop_id, can_create_bill, can_update_stock, can_view_reports, created_at, updated_at"
    )
    .eq("business_owner_id", businessOwnerId)
    .order("created_at", { ascending: false })

  if (error?.code === "42P01" || error?.code === "42703") {
    return { ok: false, status: 500, message: TABLE_SETUP_MESSAGE, data: [] }
  }

  if (error) {
    return { ok: false, status: 400, message: error.message, data: [] }
  }

  return { ok: true, status: 200, message: null, data: data ?? [] }
}

async function resolveAssignedShop(adminClient, businessOwnerId, requestedShopId) {
  const normalizedShopId = normalizeRequestedShopId(requestedShopId)

  if (normalizedShopId) {
    const ownedShop = await findOwnedShop(adminClient, businessOwnerId, normalizedShopId)
    if (!ownedShop.ok) {
      return { ok: false, status: ownedShop.status, message: "Assigned shop is invalid.", shop: null }
    }

    return { ok: true, status: 200, message: null, shop: ownedShop.shop }
  }

  const ownedShops = await listOwnedShops(adminClient, businessOwnerId)
  if (!ownedShops.ok) {
    return { ok: false, status: ownedShops.status, message: ownedShops.message, shop: null }
  }

  if (!ownedShops.shops.length) {
    return { ok: false, status: 400, message: "Create a shop before adding staff users.", shop: null }
  }

  if (ownedShops.shops.length > 1) {
    return { ok: false, status: 400, message: "Assign a shop to the staff account.", shop: null }
  }

  return { ok: true, status: 200, message: null, shop: ownedShops.shops[0] }
}

export async function GET() {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can view staff." }, { status: 403 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const staffAccess = await readStaffAccessRows(adminClient, context.user.id)
  if (!staffAccess.ok) {
    return NextResponse.json({ message: staffAccess.message }, { status: staffAccess.status })
  }

  const staffIds = staffAccess.data.map((row) => row.staff_user_id).filter(Boolean)
  if (!staffIds.length) {
    return NextResponse.json({ staff: [] }, { status: 200 })
  }

  const assignedShopIds = [...new Set(staffAccess.data.map((row) => row.assigned_shop_id).filter(Boolean))]
  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, full_name, email, role")
    .in("id", staffIds)

  if (profilesError) {
    return NextResponse.json({ message: profilesError.message }, { status: 400 })
  }

  let shopMap = new Map()
  if (assignedShopIds.length) {
    const { data: shops, error: shopsError } = await adminClient
      .from("business")
      .select("id, shop_name")
      .eq("user_id", context.user.id)
      .in("id", assignedShopIds)

    if (shopsError) {
      return NextResponse.json({ message: shopsError.message }, { status: 400 })
    }

    shopMap = new Map((shops ?? []).map((shop) => [shop.id, shop]))
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const staff = staffAccess.data
    .map((row) => {
      const profile = profileMap.get(row.staff_user_id)
      if (!profile) return null

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        permissions: {
          can_create_bill: row.can_create_bill,
          can_update_stock: row.can_update_stock,
          can_view_reports: row.can_view_reports,
        },
        assigned_shop_id: row.assigned_shop_id ?? null,
        assigned_shop_name: shopMap.get(row.assigned_shop_id)?.shop_name ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ staff }, { status: 200 })
}

export async function POST(request) {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can create staff users." }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  const fullName = String(body.full_name ?? body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const permissions = normalizeStaffPermissions(body.permissions ?? {})
  const requestedShopId = normalizeRequestedShopId(body.assigned_shop_id, body.assignedShopId)

  if (!fullName || !email || !password) {
    return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const existingAccess = await readStaffAccessRows(adminClient, context.user.id)
  if (!existingAccess.ok) {
    return NextResponse.json({ message: existingAccess.message }, { status: existingAccess.status })
  }

  const assignedShop = await resolveAssignedShop(adminClient, context.user.id, requestedShopId)
  if (!assignedShop.ok) {
    return NextResponse.json({ message: assignedShop.message }, { status: assignedShop.status })
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: ROLES.STAFF,
    },
  })

  if (createUserError || !createdUserData?.user?.id) {
    return NextResponse.json({ message: createUserError?.message ?? "Unable to create staff user." }, { status: 400 })
  }

  const staffUserId = createdUserData.user.id

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: staffUserId,
        full_name: fullName,
        email,
        role: ROLES.STAFF,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    await adminClient.auth.admin.deleteUser(staffUserId)
    return NextResponse.json({ message: profileError.message }, { status: 400 })
  }

  const { error: roleError } = await adminClient
    .from("user_roles")
    .upsert(
      {
        user_id: staffUserId,
        role: ROLES.STAFF,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (roleError) {
    await adminClient.auth.admin.deleteUser(staffUserId)
    return NextResponse.json({ message: roleError.message }, { status: 400 })
  }

  const { error: accessError } = await adminClient.from("staff_permissions").upsert(
    {
      staff_user_id: staffUserId,
      business_owner_id: context.user.id,
      assigned_shop_id: assignedShop.shop.id,
      ...permissions,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "staff_user_id" }
  )

  if (accessError?.code === "42P01") {
    await adminClient.auth.admin.deleteUser(staffUserId)
    return NextResponse.json({ message: TABLE_SETUP_MESSAGE }, { status: 500 })
  }

  if (accessError) {
    await adminClient.auth.admin.deleteUser(staffUserId)
    return NextResponse.json({ message: accessError.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      message: "Staff user created successfully.",
      staff: {
        id: staffUserId,
        full_name: fullName,
        email,
        role: ROLES.STAFF,
        permissions,
        assigned_shop_id: assignedShop.shop.id,
        assigned_shop_name: assignedShop.shop.shop_name,
      },
    },
    { status: 201 }
  )
}
