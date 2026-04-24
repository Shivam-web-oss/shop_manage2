'use server'

import { redirect, unstable_rethrow } from 'next/navigation'
import { createClient } from '../src/lib/supabase/server'
import { normalizeRole, ROLES } from '@/lib/authz'

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isRecoverableSetupError(error) {
  return error?.code === '42P01' || error?.code === '42703'
}

export async function loginAction(_state, formData) {
  const email = normalizeValue(formData.get('email')).toLowerCase()
  const password = typeof formData.get('password') === 'string' ? formData.get('password') : ''

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
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

    if (profileError && !isRecoverableSetupError(profileError)) {
      console.error('Login profile lookup failed.', profileError)
      return { error: profileError.message }
    }

    const role = normalizeRole(profile?.role ?? data.user.user_metadata?.role)

    if (role === ROLES.ADMIN) {
      redirect('/admin')
    }

    if (role === ROLES.STAFF) {
      redirect('/employee')
    }

    const { data: business, error: businessError } = await supabase
      .from('business')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (businessError && !isRecoverableSetupError(businessError)) {
      console.error('Login business lookup failed.', businessError)
      return { error: businessError.message }
    }

    redirect(business ? '/business' : '/business/create')
  } catch (error) {
    unstable_rethrow(error)
    console.error('Login action crashed.', error)
    return {
      error: error instanceof Error ? error.message : 'Unable to login right now.',
    }
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
