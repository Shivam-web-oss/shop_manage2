import Link from "next/link"

export default function SectionHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[linear-gradient(135deg,#ffffff,#f7fafc_58%,#eef6ff_100%)] p-6 shadow-[0_22px_44px_rgba(15,23,42,0.1)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[rgba(47,158,107,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[rgba(59,130,246,0.1)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(148,163,184,0.2)] bg-[radial-gradient(circle,_rgba(47,158,107,0.1),_transparent_62%)]" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-deep)]">{eyebrow}</p>
      <div className="relative mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-muted)] sm:text-base">{description}</p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="ui-btn-primary px-5 py-3 text-sm"
              >
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="ui-btn-secondary px-5 py-3 text-sm"
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
