'use server'

/**
 * BEGINNER NOTES
 * File: app/actions/auth.js
 * Purpose: Project file.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { redirect, unstable_rethrow } from 'next/navigation'
import { createClient } from '../src/lib/supabase/server'
import { normalizeRole, ROLES } from '@/lib/authz'

// Small helper to safely read string values from a `<form>`.
function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// During first-time setup, the database tables/columns might not exist yet.
// These Postgres error codes represent "missing table" / "missing column".
function isRecoverableSetupError(error) {
  return error?.code === '42P01' || error?.code === '42703'
}

// Server Action: called by the login form submission.
// Data sources:
// - Supabase Auth: `supabase.auth.signInWithPassword(...)`
// - Supabase DB: `profiles` and `business` tables
// What it returns:
// - `{ error: string }` to show a message on the form
// - or it `redirect(...)`s the browser to the right dashboard
export async function loginAction(_state, formData) {
  // Read user input from the form.
  const email = normalizeValue(formData.get('email')).toLowerCase()
  const password = typeof formData.get('password') === 'string' ? formData.get('password') : ''

  // Basic validation so we can show a friendly error without calling the server.
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    // Create a server-side Supabase client with cookie-based session handling.
    const supabase = await createClient()

    // Attempt login via Supabase Auth using email + password.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If login fails, show a clear error message (no redirect).
    if (error || !data.user) {
      return { error: error?.message || 'Invalid email or password.' }
    }

    const userId = data.user.id

    // Look up the user’s role from the `profiles` table.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    // If the lookup fails for real (not just "table missing"), stop and show the error.
    if (profileError && !isRecoverableSetupError(profileError)) {
      console.error('Login profile lookup failed.', profileError)
      return { error: profileError.message }
    }

    // Determine which dashboard to send the user to.
    // We prefer `profiles.role`, but fall back to Auth metadata if needed.
    const role = normalizeRole(profile?.role ?? data.user.user_metadata?.role)

    if (role === ROLES.ADMIN) {
      redirect('/admin')
    }

    if (role === ROLES.STAFF) {
      redirect('/employee')
    }

    // For business users, see if they already created a business record.
    const { data: business, error: businessError } = await supabase
      .from('business')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    // If the lookup fails, show the error unless it’s a known setup-only issue.
    if (businessError && !isRecoverableSetupError(businessError)) {
      console.error('Login business lookup failed.', businessError)
      return { error: businessError.message }
    }

    // If they have a business, go to the main business dashboard.
    // Otherwise, send them to the business creation screen.
    redirect(business ? '/business' : '/business/create')
  } catch (error) {
    // Next.js uses special error types for navigation/redirect; this rethrows those correctly.
    unstable_rethrow(error)
    console.error('Login action crashed.', error)
    return {
      error: error instanceof Error ? error.message : 'Unable to login right now.',
    }
  }
}

// Server Action: logs the user out and returns to the login page.
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
