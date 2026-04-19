"use client"

import { useEffect, useState } from "react"

const DEFAULT_PERMISSIONS = {
  can_create_bill: true,
  can_update_stock: true,
  can_view_reports: true,
}

export default function StaffManager() {
  const [staff, setStaff] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    permissions: { ...DEFAULT_PERMISSIONS },
  })

  async function loadStaff() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/staff", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to load staff users.")
      }

      const rows = Array.isArray(data.staff) ? data.staff : []
      setStaff(rows)
      setDrafts(
        rows.reduce((acc, row) => {
          acc[row.id] = {
            full_name: row.full_name ?? "",
            permissions: {
              can_create_bill: row.permissions?.can_create_bill !== false,
              can_update_stock: row.permissions?.can_update_stock !== false,
              can_view_reports: row.permissions?.can_view_reports !== false,
            },
          }
          return acc
        }, {})
      )
    } catch (loadError) {
      setError(loadError.message || "Unable to load staff users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  function setCreatePermission(field, value) {
    setCreateForm((previous) => ({
      ...previous,
      permissions: {
        ...previous.permissions,
        [field]: value,
      },
    }))
  }

  async function createStaff(event) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password) {
      setError("Please fill in name, email, and password.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: createForm.full_name.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          permissions: createForm.permissions,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to create staff user.")
      }

      setMessage("Staff user created successfully.")
      setCreateForm({
        full_name: "",
        email: "",
        password: "",
        permissions: { ...DEFAULT_PERMISSIONS },
      })
      await loadStaff()
    } catch (createError) {
      setError(createError.message || "Unable to create staff user.")
    } finally {
      setSaving(false)
    }
  }

  function setDraftName(staffId, value) {
    setDrafts((previous) => ({
      ...previous,
      [staffId]: {
        ...previous[staffId],
        full_name: value,
      },
    }))
    setError("")
    setMessage("")
  }

  function setDraftPermission(staffId, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [staffId]: {
        ...previous[staffId],
        permissions: {
          ...previous[staffId]?.permissions,
          [field]: value,
        },
      },
    }))
    setError("")
    setMessage("")
  }

  async function saveStaff(staffId) {
    const draft = drafts[staffId]
    if (!draft?.full_name?.trim()) {
      setError("Staff name cannot be empty.")
      return
    }

    setSaving(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: draft.full_name.trim(),
          permissions: draft.permissions,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to update staff user.")
      }

      setMessage("Staff user updated.")
      await loadStaff()
    } catch (saveError) {
      setError(saveError.message || "Unable to update staff user.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteStaff(staffId) {
    const confirmed = window.confirm("Delete this staff user permanently?")
    if (!confirmed) return

    setSaving(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete staff user.")
      }

      setMessage("Staff user deleted.")
      await loadStaff()
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete staff user.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Create Staff User</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Business owners can create staff accounts and control what each staff member can access.
        </p>

        <form onSubmit={createStaff} className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="ui-input"
            placeholder="Full name"
            value={createForm.full_name}
            onChange={(event) => setCreateForm((previous) => ({ ...previous, full_name: event.target.value }))}
            required
          />
          <input
            className="ui-input"
            type="email"
            placeholder="Email"
            value={createForm.email}
            onChange={(event) => setCreateForm((previous) => ({ ...previous, email: event.target.value }))}
            required
          />
          <input
            className="ui-input md:col-span-2"
            type="password"
            placeholder="Password (min 6 chars)"
            value={createForm.password}
            onChange={(event) => setCreateForm((previous) => ({ ...previous, password: event.target.value }))}
            required
          />
          <div className="md:col-span-2 grid gap-2 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
            <PermissionToggle
              label="Can create bills"
              checked={createForm.permissions.can_create_bill}
              onChange={(checked) => setCreatePermission("can_create_bill", checked)}
            />
            <PermissionToggle
              label="Can update stock"
              checked={createForm.permissions.can_update_stock}
              onChange={(checked) => setCreatePermission("can_update_stock", checked)}
            />
            <PermissionToggle
              label="Can view reports"
              checked={createForm.permissions.can_view_reports}
              onChange={(checked) => setCreatePermission("can_view_reports", checked)}
            />
          </div>
          <button
            type="submit"
            className="ui-btn-primary px-5 py-3 text-sm md:col-span-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Staff Account"}
          </button>
        </form>
      </article>

      <article className="ui-card rounded-3xl p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Manage Staff Access</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Staff can edit profile only. Role is locked and cannot be changed.</p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        {loading ? (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">Loading staff users...</p>
        ) : staff.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--ink-muted)]">No staff users yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {staff.map((member) => {
              const draft = drafts[member.id] ?? {
                full_name: member.full_name ?? "",
                permissions: { ...DEFAULT_PERMISSIONS },
              }

              return (
                <div key={member.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="ui-input"
                      value={draft.full_name}
                      onChange={(event) => setDraftName(member.id, event.target.value)}
                    />
                    <input className="ui-input" value={member.email ?? ""} disabled />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">Role: {member.role}</p>
                  <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm">
                    <PermissionToggle
                      label="Can create bills"
                      checked={draft.permissions?.can_create_bill !== false}
                      onChange={(checked) => setDraftPermission(member.id, "can_create_bill", checked)}
                    />
                    <PermissionToggle
                      label="Can update stock"
                      checked={draft.permissions?.can_update_stock !== false}
                      onChange={(checked) => setDraftPermission(member.id, "can_update_stock", checked)}
                    />
                    <PermissionToggle
                      label="Can view reports"
                      checked={draft.permissions?.can_view_reports !== false}
                      onChange={(checked) => setDraftPermission(member.id, "can_view_reports", checked)}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="ui-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => saveStaff(member.id)}
                      disabled={saving}
                    >
                      Save Access
                    </button>
                    <button
                      type="button"
                      className="ui-btn-secondary px-4 py-2 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => deleteStaff(member.id)}
                      disabled={saving}
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </article>
    </section>
  )
}

function PermissionToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[var(--foreground)]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
