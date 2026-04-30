/**
 * BEGINNER NOTES
 * File: app/src/lib/staff-permissions.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

export const DEFAULT_STAFF_PERMISSIONS = Object.freeze({
  // Default "allowed" permission set when a staff member is created.
  can_create_bill: true,
  can_update_stock: true,
  can_view_reports: true,
})

export const DENIED_STAFF_PERMISSIONS = Object.freeze({
  // Default "deny all" permission set when access is missing/blocked.
  can_create_bill: false,
  can_update_stock: false,
  can_view_reports: false,
})

// Converts a loose payload (checkboxes/JSON) into strict booleans.
export function normalizeStaffPermissions(payload = {}) {
  return {
    can_create_bill: payload.can_create_bill !== false,
    can_update_stock: payload.can_update_stock !== false,
    can_view_reports: payload.can_view_reports !== false,
  }
}

// Maps a DB row (e.g. from `staff_permissions`) into a simple permission object.
// Why: database values may be null/undefined; this guarantees booleans.
export function mapPermissionsFromRow(row, fallback = DENIED_STAFF_PERMISSIONS) {
  if (!row || typeof row !== "object") {
    return { ...fallback }
  }

  return normalizeStaffPermissions({
    can_create_bill: row.can_create_bill,
    can_update_stock: row.can_update_stock,
    can_view_reports: row.can_view_reports,
  })
}
