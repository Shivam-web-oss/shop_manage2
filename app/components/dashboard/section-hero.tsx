import Link from "next/link"
import type { ReactNode } from "react"

type SectionHeroProps = {
  eyebrow: string
  title: string
  description: string
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
  children?: ReactNode
}

export default function SectionHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: SectionHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[linear-gradient(135deg,_rgba(12,15,15,0.98),_rgba(16,20,20,0.96)_54%,_rgba(28,36,34,0.94)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[rgba(201,246,199,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[rgba(201,246,199,0.08)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 bg-[radial-gradient(circle,_rgba(201,246,199,0.08),_transparent_60%)]" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">{eyebrow}</p>
      <div className="relative mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-muted)] sm:text-base">{description}</p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#08100c] transition hover:bg-[#dbffda]"
              >
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="rounded-full border border-white/18 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </div>
      {children && <div className="relative mt-8">{children}</div>}
    </section>
  )
}
