import { NextResponse } from 'next/server'
import { createClient } from '../../src/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body.email?.toString().trim()
    const password = body.password?.toString()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const signUpParams: {
      email: string
      password: string
      options?: { data: { full_name: string } }
    } = { email, password }

    const name = body.name?.toString().trim()
    if (name) {
      signUpParams.options = { data: { full_name: name } }
    }

    const { data, error } = await supabase.auth.signUp(signUpParams)

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        user: data.user ?? null,
        message: 'Registration successful. Please check your email for confirmation if required.',
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
