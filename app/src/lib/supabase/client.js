/**
 * BEGINNER NOTES
 * File: app/src/lib/supabase/client.js
 * Purpose: Creates a Supabase client for the browser (client components).
 * Data sources: Supabase project URL + publishable key from environment variables.
 * Why this exists: Browser UI needs to call Supabase directly for some features (with user session).
 */

import { createBrowserClient } from '@supabase/ssr'

// Supabase project connection details injected at build/runtime.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// Factory used by client-side code to talk to Supabase.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
