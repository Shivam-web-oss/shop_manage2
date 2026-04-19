import Link from "next/link"

export const metadata = {
  title: "Landing Page",
  description: "See how Shop Manager improves day-to-day business performance.",
}

const resultCards = [
  { label: "Inventory visibility", value: "Live shop-level tracking" },
  { label: "Order execution", value: "Manual team updates" },
  { label: "Business reporting", value: "Based on saved entries" },
]

const impactPoints = [
  "Live inventory visibility for every product and branch.",
  "Cleaner order flow so staff can fulfill faster with fewer manual steps.",
  "Customer history and reporting that helps owners make better weekly decisions.",
]

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section className="glass rounded-3xl p-8 text-center shadow-2xl sm:p-10">
        <p className="mb-3 text-sm uppercase tracking-[0.24em] text-[var(--accent-deep)]">Shop Management Platform</p>
        <h1 className="text-4xl font-bold text-[var(--foreground)] sm:text-5xl">Better Business Outcomes, Not Just Better Screens</h1>
        <p className="mx-auto mt-5 max-w-3xl text-base text-[var(--ink-muted)] sm:text-lg">
          ShopManager helps store owners track stock, speed up operations, and understand what is happening across the business in real time.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="ui-btn-primary px-7 py-3"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="ui-btn-secondary px-7 py-3"
          >
            Login
          </Link>
        </div>
      </section>

      <section id="results" className="grid gap-4 sm:grid-cols-3">
        {resultCards.map((item) => (
          <article key={item.label} className="glass rounded-3xl p-6">
            <p className="text-sm text-[var(--ink-muted)]">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--accent-deep)]">{item.value}</p>
          </article>
        ))}
      </section>

      <section id="impact" className="glass rounded-3xl p-8 sm:p-10">
        <h2 className="text-3xl font-bold text-[var(--foreground)]">What This Means for a Real Business</h2>
        <div className="mt-6 space-y-4">
          {impactPoints.map((point) => (
            <p key={point} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)]">
              {point}
            </p>
          ))}
        </div>
      </section>
    </div>
  )
}
