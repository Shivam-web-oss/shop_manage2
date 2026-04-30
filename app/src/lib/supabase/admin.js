/**
 * BEGINNER NOTES
 * File: app/src/lib/supabase/admin.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import { createClient } from "@supabase/supabase-js"

// Supabase project URL (safe to expose) and "service role" key (VERY sensitive).
// The service role key bypasses Row Level Security (RLS), so it must never run in the browser.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Creates a Supabase client with admin privileges.
// Use this only on trusted server-side code (API routes, server actions).
export function createAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role configuration is missing.")
  }

  // We disable session persistence because admin operations shouldn't rely on end-user sessions.
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
