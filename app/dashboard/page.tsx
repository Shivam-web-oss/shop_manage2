const stats = [
  {
    label: "Total Shops",
    value: "3",
    description: "All active locations",
    color: "bg-sky-100 text-sky-700",
    icon: "Shop",
  },
  {
    label: "Total Employees",
    value: "16",
    description: "Team members in all shops",
    color: "bg-emerald-100 text-emerald-700",
    icon: "Team",
  },
  {
    label: "Total Revenue",
    value: "$310K",
    description: "Revenue generated this month",
    color: "bg-violet-100 text-violet-700",
    icon: "Money",
  },
  {
    label: "Avg Revenue/Shop",
    value: "$103K",
    description: "Average shop performance",
    color: "bg-orange-100 text-orange-700",
    icon: "Chart",
  },
]

const shops = [
  {
    name: "Downtown Store",
    location: "New York, NY",
    description: "Main flagship store in downtown Manhattan",
    status: "active",
  },
  {
    name: "Westside Branch",
    location: "Los Angeles, CA",
    description: "High-volume storefront near the westside mall",
    status: "active",
  },
  {
    name: "East Bay Outlet",
    location: "Oakland, CA",
    description: "Popular outlet store for local shoppers",
    status: "active",
  },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full max-w-2xl">
              <span className="sr-only">Search shops, employees</span>
              <input
                type="search"
                placeholder="Search shops, employees..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
              <p className="mt-2 text-sm text-slate-600">Manage all your shops from one place.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-violet-200/50 transition hover:bg-violet-700">
                Super Admin
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Shop Admin
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Employee
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`${item.color} flex h-14 w-14 items-center justify-center rounded-2xl text-xl`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-[32px] bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Your Shops</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Active locations</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Active
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {shops.map((shop) => (
              <div key={shop.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{shop.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{shop.location}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {shop.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{shop.description}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                  <span>View details</span>
                  <span className="text-violet-600">›</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
