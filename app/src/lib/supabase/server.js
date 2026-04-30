/**
 * BEGINNER NOTES
 * File: app/src/lib/supabase/server.js
 * Purpose: Creates a Supabase client for Server Components / server actions / API routes.
 * Data sources: Supabase project URL + key from environment variables; auth session from cookies.
 * Why this exists: Central place to configure Supabase + cookie session handling.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase project connection details.
// These are configured in `.env*` files (or hosting provider env vars).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// In production we mark cookies as `secure` (HTTPS only).
const secureCookies = process.env.NODE_ENV === 'production'

// Factory function used across the app to talk to Supabase on the server.
// It wires Supabase auth to Next.js cookies so sessions persist between requests.
export async function createClient() {
  // `cookies()` gives access to the request/response cookie store in Next.js.
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    // Default cookie behavior for the auth session tokens.
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
    },
    cookies: {
      // Supabase asks for "get all cookies" so it can read its session tokens.
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }))
      },
      // Supabase will also attempt to set/refresh auth cookies.
      // This is wrapped in try/catch because some Next.js contexts disallow writes.
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: options?.sameSite ?? 'lax',
              secure: options?.secure ?? secureCookies,
              path: options?.path ?? '/',
            })
          })
        } catch {}
      },
    },
  })
}
