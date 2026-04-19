import { NextResponse } from "next/server"
import { getApiAuthContext, hasAnyRole } from "@/lib/api-auth"
import { ROLES } from "@/lib/authz"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeStaffPermissions } from "@/lib/staff-permissions"

const TABLE_SETUP_MESSAGE =
  "Staff access table is missing. Run the SQL in sql/staff-permissions.sql and try again."

async function findStaffAssignment(adminClient, businessOwnerId, staffUserId) {
  const { data, error } = await adminClient
    .from("staff_permissions")
    .select("id, staff_user_id, business_owner_id")
    .eq("business_owner_id", businessOwnerId)
    .eq("staff_user_id", staffUserId)
    .maybeSingle()

  if (error?.code === "42P01") {
    return { ok: false, status: 500, message: TABLE_SETUP_MESSAGE, data: null }
  }

  if (error) {
    return { ok: false, status: 400, message: error.message, data: null }
  }

  if (!data) {
    return { ok: false, status: 404, message: "Staff user not found for your business.", data: null }
  }

  return { ok: true, status: 200, message: null, data }
}

export async function PATCH(request, { params }) {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can update staff users." }, { status: 403 })
  }

  const resolvedParams = await params
  const staffUserId = resolvedParams?.id
  if (!staffUserId) {
    return NextResponse.json({ message: "Staff user id is required." }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const assignment = await findStaffAssignment(adminClient, context.user.id, staffUserId)
  if (!assignment.ok) {
    return NextResponse.json({ message: assignment.message }, { status: assignment.status })
  }

  const nextFullName = Object.prototype.hasOwnProperty.call(body, "full_name")
    ? String(body.full_name ?? "").trim()
    : null

  if (nextFullName !== null && !nextFullName) {
    return NextResponse.json({ message: "Full name cannot be empty." }, { status: 400 })
  }

  if (nextFullName !== null) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: nextFullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", staffUserId)

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 400 })
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "permissions")) {
    const permissions = normalizeStaffPermissions(body.permissions)
    const { error: permissionError } = await adminClient
      .from("staff_permissions")
      .update({
        ...permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("staff_user_id", staffUserId)
      .eq("business_owner_id", context.user.id)

    if (permissionError?.code === "42P01") {
      return NextResponse.json({ message: TABLE_SETUP_MESSAGE }, { status: 500 })
    }

    if (permissionError) {
      return NextResponse.json({ message: permissionError.message }, { status: 400 })
    }
  }

  const { data: staffProfile, error: profileReadError } = await adminClient
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", staffUserId)
    .maybeSingle()

  if (profileReadError || !staffProfile) {
    return NextResponse.json({ message: profileReadError?.message ?? "Staff user not found." }, { status: 400 })
  }

  const { data: permissionRow, error: permissionReadError } = await adminClient
    .from("staff_permissions")
    .select("can_create_bill, can_update_stock, can_view_reports")
    .eq("staff_user_id", staffUserId)
    .eq("business_owner_id", context.user.id)
    .maybeSingle()

  if (permissionReadError) {
    return NextResponse.json({ message: permissionReadError.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      message: "Staff user updated successfully.",
      staff: {
        id: staffProfile.id,
        full_name: staffProfile.full_name,
        email: staffProfile.email,
        role: staffProfile.role,
        permissions: {
          can_create_bill: permissionRow?.can_create_bill ?? true,
          can_update_stock: permissionRow?.can_update_stock ?? true,
          can_view_reports: permissionRow?.can_view_reports ?? true,
        },
      },
    },
    { status: 200 }
  )
}

export async function DELETE(_request, { params }) {
  const context = await getApiAuthContext()
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status })
  }

  if (!hasAnyRole(context.role, [ROLES.BUSINESS])) {
    return NextResponse.json({ message: "Only business users can delete staff users." }, { status: 403 })
  }

  const resolvedParams = await params
  const staffUserId = resolvedParams?.id
  if (!staffUserId) {
    return NextResponse.json({ message: "Staff user id is required." }, { status: 400 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const assignment = await findStaffAssignment(adminClient, context.user.id, staffUserId)
  if (!assignment.ok) {
    return NextResponse.json({ message: assignment.message }, { status: assignment.status })
  }

  await adminClient
    .from("staff_permissions")
    .delete()
    .eq("staff_user_id", staffUserId)
    .eq("business_owner_id", context.user.id)

  await adminClient.from("user_roles").delete().eq("user_id", staffUserId)
  await adminClient.from("profiles").delete().eq("id", staffUserId)

  const { error: deleteAuthUserError } = await adminClient.auth.admin.deleteUser(staffUserId)
  if (deleteAuthUserError) {
    return NextResponse.json({ message: deleteAuthUserError.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Staff user deleted successfully." }, { status: 200 })
}
