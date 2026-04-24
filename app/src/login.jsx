'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction } from '../actions/auth'
import PublicAuthShell from '../components/public/public-auth-shell'
import { useUiLanguage } from '../components/ui/ui-language'

const initialState = { error: '' }

function LoginButton({ label, pendingLabel }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="ui-btn-primary mt-6 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const { copy } = useUiLanguage()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center py-6">
      <PublicAuthShell mode="login">
        <form action={formAction}>
          <p className="ui-eyebrow">{copy('Login', 'लॉग इन')}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            {copy('Welcome back', 'फिर से स्वागत है')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)] sm:text-base">
            {copy(
              'Use your email and password to continue to the same dashboard, billing, and reporting experience.',
              'अपने ईमेल और पासवर्ड से उसी डैशबोर्ड, बिलिंग और रिपोर्टिंग अनुभव में वापस जाएं।'
            )}
          </p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy('Email address', 'ईमेल पता')}</span>
              <input
                name="email"
                type="email"
                placeholder={copy('Enter your email', 'अपना ईमेल लिखें')}
                autoComplete="email"
                required
                className="ui-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">{copy('Password', 'पासवर्ड')}</span>
              <input
                name="password"
                placeholder={copy('Enter your password', 'अपना पासवर्ड लिखें')}
                type="password"
                autoComplete="current-password"
                required
                className="ui-input mt-2"
              />
            </label>
          </div>

          {state?.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}

          <LoginButton
            label={copy('Login', 'लॉग इन')}
            pendingLabel={copy('Signing in...', 'लॉग इन हो रहा है...')}
          />

          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--ink-muted)]">
            <p className="font-medium text-[var(--foreground)]">{copy('New here?', 'नए हैं?')}</p>
            <p className="mt-2 leading-6">
              {copy(
                'Create a new account if you are setting up ShopManager for the first time.',
                'अगर आप पहली बार ShopManager सेट कर रहे हैं, तो नया खाता बनाएं।'
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
            {copy('Do not have an account?', 'क्या आपका खाता नहीं है?')}{' '}
            <Link href="/register" className="font-semibold text-[var(--accent-deep)] hover:underline">
              {copy('Create one now', 'अभी बनाएं')}
            </Link>
          </p>
        </form>
      </PublicAuthShell>
    </div>
  )
}
