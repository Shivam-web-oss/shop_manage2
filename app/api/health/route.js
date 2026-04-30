/**
 * BEGINNER NOTES
 * File: app/api/health/route.js
 * Purpose: Small API endpoint that checks whether the server can talk to Supabase.
 * Data sources: Supabase auth/session service through the server Supabase client.
 * Why this exists: Helpful for quickly confirming deployment and database connectivity.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Create a Supabase server client for this request.
    const supabase = await createClient()
    // Ask Supabase for the current session; any error means the connection/config is unhealthy.
    const { error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString(), supabase: true },
      { status: 200 }
    )
  } catch (error) {
    // Return a JSON error so health checks and browser users can see what failed.
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
