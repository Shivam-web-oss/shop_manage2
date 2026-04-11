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
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(122,46,29,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(122,46,29,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[rgba(184,92,56,0.18)] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[rgba(126,168,157,0.16)] blur-3xl" />
          <Navbar />
          <main className="relative flex-1 px-4 pb-16 pt-24 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
