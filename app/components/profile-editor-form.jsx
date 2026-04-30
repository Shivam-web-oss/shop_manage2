"use client"

/**
 * BEGINNER NOTES
 * File: app/components/profile-editor-form.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updateProfileAction } from "../actions/profile"

const initialState = { error: "", success: "" }

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="ui-btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save Profile"}
    </button>
  )
}

export default function ProfileEditorForm({ defaultName }) {
  const [state, action] = useActionState(updateProfileAction, initialState)

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="fullName">
        Full Name
      </label>
      <input
        id="fullName"
        name="fullName"
        defaultValue={defaultName}
        className="ui-input"
        placeholder="Enter full name"
        required
      />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <SaveButton />
    </form>
  )
}
