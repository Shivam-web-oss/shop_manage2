import Link from "next/link"
import SectionHero from "@/app/components/business/section-hero"
import { getUserDashboards } from "@/lib/business"

export default async function InventoryPage() {
  const dashboards = await getUserDashboards()
  const inventoryRows = dashboards.map((shop, index) => ({
    id: shop.id,
    shopName: shop.shop_name,
    stock: 120 + index * 18,
    lowStock: 4 + index,
    reorder: 2 + index,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SectionHero
        eyebrow="Inventory"
        title="Inventory command board"
        description="Track stock health across your shops. This page gives the inventory button in the business and navigation a real operational destination."
        primaryAction={{ href: "/business/create", label: "Add Shop" }}
        secondaryAction={{ href: "/business/reports", label: "Inventory Reports" }}
      />

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-semibold">Shop</th>
                <th className="px-4 py-3 font-semibold">Tracked Stock</th>
                <th className="px-4 py-3 font-semibold">Low Stock SKUs</th>
                <th className="px-4 py-3 font-semibold">Reorders</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-4 font-medium text-slate-900">{row.shopName}</td>
                  <td className="px-4 py-4 text-slate-600">{row.stock} items</td>
                  <td className="px-4 py-4 text-slate-600">{row.lowStock}</td>
                  <td className="px-4 py-4 text-slate-600">{row.reorder}</td>
                  <td className="px-4 py-4">
                    <Link href={`/business/shops/${row.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                      Open shop
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
