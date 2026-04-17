import Link from 'next/link'
import { logoutAction } from '../actions/auth'
import { createClient } from '../src/lib/supabase/server'

export default async function ProfilePanel() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="glass rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome back!</h2>
        <p className="text-white/70 mb-6">Please log in to view your profile details.</p>
        <Link
          href="/login"
          className="inline-block rounded-full border border-white/30 bg-white/10 px-6 py-3 text-white hover:bg-white/20 transition"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Shop Manager User'
  const role = profile?.role ?? 'unknown'
  const dashboardHref = role === 'admin' ? '/admin' : '/business'

  return (
    <div className="glass rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-white/60 uppercase tracking-[0.2em] mb-2">Profile</p>
          <h1 className="text-3xl font-bold text-white">{fullName}</h1>
          <h1 className="text-3xl font-bold text-white">user role :{role}</h1>
          <p className="text-white/70 mt-2">Signed in with {user.email}</p>
          {profileError && <p className="mt-2 text-sm text-red-300">{profileError.message}</p>}
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
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-white/20 px-5 py-3 text-white hover:bg-white/30 transition"
              >
                Logout
              </button>
            </form>
            <Link
              href={`https://dashboard-gamma-beryl-18.vercel.app/dashboard/${user.id}`}
              className="rounded-full border border-white/30 px-5 py-3 text-white hover:bg-white/10 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
