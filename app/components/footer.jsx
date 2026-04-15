import Link from "next/link"

const productLinks = [
  { href: "/business", label: "Business" },
  { href: "/business/inventory", label: "Inventory" },
  { href: "/business/orders", label: "Orders" },
  { href: "/business/customers", label: "Customers" },
  { href: "/business/reports", label: "Reports" },
]

const supportLinks = [
  { href: "/help", label: "Help Center" },
  { href: "/docs", label: "Documentation" },
  { href: "/contact", label: "Contact Us" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
]

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[var(--border)] bg-[rgba(9,12,12,0.96)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">ShopManager</p>
          <h2 className="mt-4 max-w-md text-3xl font-semibold text-white">
            Keep every shop, order, customer, and report in one sharp workspace.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ink-muted)]">
            This business now includes connected navigation, detailed shop views, and dedicated pages for the main management workflows.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Product</h3>
          <div className="mt-4 flex flex-col gap-3">
            {productLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-[var(--ink-muted)] transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Support</h3>
          <div className="mt-4 flex flex-col gap-3">
            {supportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-[var(--ink-muted)] transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-[var(--ink-muted)] sm:px-6 lg:px-8">
        Copyright 2026 ShopManager. All rights reserved.
      </div>
    </footer>
  )
}
