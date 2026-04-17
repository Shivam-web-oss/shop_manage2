import { redirect } from 'next/navigation'
import { createClient } from '../src/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') {
    redirect('/business')
  }

  return (
    <div>
      <h1>Admin access</h1>
      <p>name - email - role(dropdown) - profile </p>
    </div>
  )
}
