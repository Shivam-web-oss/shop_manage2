'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../src/lib/supabase/client'

type UserProfile = {
  id: string
  email: string | null
  fullName: string | null
}

export default function ProfilePanel() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const currentUser = session?.user
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const fullName =
        (currentUser.user_metadata as Record<string, unknown>)?.full_name as string | null ||
        (currentUser.user_metadata as Record<string, unknown>)?.name as string | null ||
        null

      setUser({
        id: currentUser.id,
        email: currentUser.email ?? null,
        fullName,
      })
      setLoading(false)
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 max-w-3xl mx-auto text-center shadow-2xl">
        <p className="text-white/80">Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome back!</h2>
        <p className="text-white/70 mb-6">Please log in to view your profile details.</p>
        <a
          href="/login"
          className="inline-block rounded-full border border-white/30 bg-white/10 px-6 py-3 text-white hover:bg-white/20 transition"
        >
          Go to Login
        </a>
      </div>
    )
  }

  return (
    <div className="glass rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-white/60 uppercase tracking-[0.2em] mb-2">Profile</p>
          <h1 className="text-3xl font-bold text-white">{user.fullName || 'Shop Manager User'}</h1>
          <p className="text-white/70 mt-2">Signed in with {user.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/60 uppercase tracking-[0.2em] mb-2">Account ID</p>
            <p className="text-white break-all">{user.id}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/60 uppercase tracking-[0.2em] mb-2">Email</p>
            <p className="text-white">{user.email}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/60 uppercase tracking-[0.2em] mb-2">Quick actions</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full bg-white/20 px-5 py-3 text-white hover:bg-white/30 transition"
            >
              Logout
            </button>
            <a
              href="/routes"
              className="rounded-full border border-white/30 px-5 py-3 text-white hover:bg-white/10 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
