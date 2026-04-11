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
    <section className="overflow-hidden rounded-[32px] border border-white/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.94))] p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">{eyebrow}</p>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">{description}</p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </section>
  )
}
