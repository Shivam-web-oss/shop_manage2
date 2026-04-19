import "./globals.css"
import Navbar from "./components/navbar"
import PublicNavbar from "./components/public-navbar"

export const metadata = {
  title: "Shop Manager",
  description: "Manage your shop network, inventory, orders, customers, and reports from one place.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.045)_1px,_transparent_1px)] bg-[length:16px_16px] opacity-30" />
          <div className="pointer-events-none absolute left-1/2 top-28 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-[rgba(148,163,184,0.18)] bg-[radial-gradient(circle,_rgba(47,158,107,0.14),_rgba(47,158,107,0.05)_38%,_transparent_62%)] blur-2xl" />
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[rgba(59,130,246,0.1)] blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 right-0 h-96 w-96 rounded-full bg-[rgba(47,158,107,0.08)] blur-3xl" />
          <PublicNavbar />
          <Navbar />
          <main className="relative flex-1 px-4 pb-16 pt-24 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
