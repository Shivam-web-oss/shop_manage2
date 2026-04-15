import Link from 'next/link'

export const metadata = {
  title: 'Landing Page',
  description: 'Welcome to the shop manager landing page.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="glass rounded-3xl p-8 max-w-3xl text-center shadow-2xl">
        <h1 className="text-4xl font-bold mb-6 text-white">Welcome to the Shop Manager!</h1>
        <p className="text-lg text-white/80 mb-10">
          Manage your shop efficiently with our powerful tools. Please login or register to get started.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="rounded-full bg-white/20 text-white px-6 py-3 transition hover:bg-white/30 backdrop-blur-sm border border-white/30"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white/10 text-white px-6 py-3 transition hover:bg-white/20 backdrop-blur-sm border border-white/20"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  )
}
