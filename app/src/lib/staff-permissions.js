export const DEFAULT_STAFF_PERMISSIONS = Object.freeze({
  can_create_bill: true,
  can_update_stock: true,
  can_view_reports: true,
})

export function normalizeStaffPermissions(payload = {}) {
  return {
    can_create_bill: payload.can_create_bill !== false,
    can_update_stock: payload.can_update_stock !== false,
    can_view_reports: payload.can_view_reports !== false,
  }
}

export function mapPermissionsFromRow(row) {
  if (!row || typeof row !== "object") {
    return { ...DEFAULT_STAFF_PERMISSIONS }
  }

  return normalizeStaffPermissions({
    can_create_bill: row.can_create_bill,
    can_update_stock: row.can_update_stock,
    can_view_reports: row.can_view_reports,
  })
}
