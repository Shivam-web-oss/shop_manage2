import React from 'react'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/routes" className="text-white text-xl font-bold hover:text-white/80 transition-colors">
              ShopManager
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/dashboard"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/routes/inventory"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Inventory
              </Link>
              <Link
                href="/routes/orders"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/routes/customers"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Customers
              </Link>
              <Link
                href="/routes/reports"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reports
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <Link
                href="/login"
                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-white hover:text-white/80 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/20 backdrop-blur-md">
          <Link
            href="/dashboard"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/routes/inventory"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Inventory
          </Link>
          <Link
            href="/routes/orders"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Orders
          </Link>
          <Link
            href="/routes/customers"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Customers
          </Link>
          <Link
            href="/routes/reports"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Reports
          </Link>
          <Link
            href="/login"
            className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Logout
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
