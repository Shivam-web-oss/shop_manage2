'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../src/lib/supabase/server'

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function loginAction(_state, formData) {
  const email = normalizeValue(formData.get('email')).toLowerCase()
  const password = typeof formData.get('password') === 'string' ? formData.get('password') : ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: error?.message || 'Invalid email or password.' }
  }

  const userId = data.user.id

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message }
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const { data: business, error: businessError } = await supabase
    .from('business')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (businessError) {
    return { error: businessError.message }
  }

  redirect(business ? '/business' : '/business/create')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
