import Link from "next/link"
import { notFound } from "next/navigation"
import ShopEditor from "@/app/components/business/shop-editor"
import { ROLES, requireRole } from "@/lib/authz"

async function getOwnedShop(supabase, shopId, userId) {
  const { data, error } = await supabase
    .from("business")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .eq("id", shopId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export default async function BusinessShopDetailsPage({ params }) {
  const context = await requireRole([ROLES.BUSINESS])
  const resolvedParams = await params
  const shopId = resolvedParams?.id

  if (!shopId) {
    notFound()
  }

  const shop = await getOwnedShop(context.supabase, shopId, context.user.id)
  if (!shop) {
    notFound()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-deep)]">Shop Details</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{shop.shop_name}</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Company: {shop.company_name} • Location: {shop.location}
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{shop.description || "No description added yet."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/business" className="ui-btn-secondary px-4 py-2 text-sm">
            Back to Business Home
          </Link>
          <Link href="/business/orders" className="ui-btn-secondary px-4 py-2 text-sm">
            Manage Products
          </Link>
          <Link href="/business/staff" className="ui-btn-secondary px-4 py-2 text-sm">
            Manage Staff
          </Link>
        </div>
      </section>

      <ShopEditor shop={shop} />
    </div>
  )
}
