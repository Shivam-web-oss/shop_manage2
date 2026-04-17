import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

const secureCookies = process.env.NODE_ENV === 'production'

function copyResponseMeta(source, target) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  source.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'x-middleware-next') {
      target.headers.set(key, value)
    }
  })

  return target
}

function createProxySupabaseClient(request, response) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
    },
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
            httpOnly: true,
            sameSite: options?.sameSite ?? 'lax',
            secure: options?.secure ?? secureCookies,
            path: options?.path ?? '/',
          })
        })

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        }
      },
    },
  })
}

export async function proxy(request) {
  const response = NextResponse.next()
  const supabase = createProxySupabaseClient(request, response)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return copyResponseMeta(response, NextResponse.redirect(loginUrl))
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') {
    return copyResponseMeta(response, NextResponse.redirect(new URL('/business', request.url)))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
