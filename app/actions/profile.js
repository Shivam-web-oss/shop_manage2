'use server'

/**
 * BEGINNER NOTES
 * File: app/actions/profile.js
 * Purpose: Project file.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Server Action: updates the current user's profile name.
// Data source: Supabase table `profiles` (row id = authenticated user id).
export async function updateProfileAction(_state, formData) {
  // Read the "fullName" field from the submitted form.
  const fullName = typeof formData.get("fullName") === "string" ? formData.get("fullName").trim() : ""

  // Validation: prevent empty names.
  if (!fullName) {
    return { error: "Full name is required." }
  }

  // Server-side Supabase client (uses cookies to know who is logged in).
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If we cannot identify the user, ask them to sign in again.
  if (authError || !user) {
    return { error: "Please login again." }
  }

  // Update the user's profile record.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      // Store an updated timestamp for auditing / UI freshness.
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  // If the DB update fails, return a message the UI can display.
  if (error) {
    return { error: error.message }
  }

  // Force Next.js to refetch the `/profile` page so the UI shows the new name.
  revalidatePath("/profile")
  return { success: "Profile updated successfully." }
}
