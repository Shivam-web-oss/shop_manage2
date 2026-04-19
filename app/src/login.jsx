'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction } from '../actions/auth'

const initialState = { error: '' }

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="ui-btn-primary w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Signing in...' : 'Login'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <form action={formAction} className="glass rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--foreground)]">Login</h1>
        <input
          name="email"
          type="email"
          placeholder="email"
          autoComplete="email"
          required
          className="ui-input mb-4"
        />
        <input
          name="password"
          placeholder="password"
          type="password"
          autoComplete="current-password"
          required
          className="ui-input mb-4"
        />
        {state?.error && <p className="mb-4 text-sm text-red-600">{state.error}</p>}
        <LoginButton />
        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          Do not have an account? <Link href="/register" className="font-medium text-[var(--accent-deep)] hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}
