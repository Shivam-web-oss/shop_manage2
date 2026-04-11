import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import Navbar from "./components/navbar"
import Footer from "./components/footer"

export const metadata: Metadata = {
  title: "Shop Manager",
  description: "Manage your shop network, inventory, orders, customers, and reports from one place.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[length:14px_14px] opacity-30" />
          <div className="pointer-events-none absolute left-1/2 top-28 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-white/5 bg-[radial-gradient(circle,_rgba(201,246,199,0.1),_rgba(201,246,199,0.03)_30%,_transparent_58%)] blur-2xl" />
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[rgba(201,246,199,0.07)] blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 right-0 h-96 w-96 rounded-full bg-[rgba(201,246,199,0.05)] blur-3xl" />
          <Navbar />
          <main className="relative flex-1 px-4 pb-16 pt-24 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
