'use client'

import { useState } from 'react'
import { createClient } from './lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      alert(userError?.message || 'Unable to load your account after login.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      alert(profileError.message)
      return
    }

    if (profile?.role === 'admin') {
      window.location.href = '/admin'
      return
    }

    const response = await fetch('/api/business/check')
    const data = await response.json().catch(() => ({}))

    if (response.ok && data.exists === false) {
      window.location.href = '/business/create'
    } else {
      window.location.href = '/business'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Login</h1>
        <input
          placeholder="email"
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          placeholder="password"
          type="password"
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition backdrop-blur-sm border border-white/30"
        >
          Login
        </button>
        DO NOT HAVE AN ACCOUNT? <a href="/register" className="text-white/80 hover:underline">Sign Up</a>
      </div>
    </div>
  )
}
