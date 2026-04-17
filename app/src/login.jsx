'use client'

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
      className="w-full bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition backdrop-blur-sm border border-white/30 disabled:cursor-not-allowed disabled:opacity-70"
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
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Login</h1>
        <input
          name="email"
          type="email"
          placeholder="email"
          autoComplete="email"
          required
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          name="password"
          placeholder="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        {state?.error && <p className="mb-4 text-sm text-red-300">{state.error}</p>}
        <LoginButton />
        DO NOT HAVE AN ACCOUNT? <a href="/register" className="text-white/80 hover:underline">Sign Up</a>
      </form>
    </div>
  )
}
