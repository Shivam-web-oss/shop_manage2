export async function getAdminBusinessDirectory(supabase) {
  const { data: businesses, error: businessError } = await supabase
    .from("business")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .order("created_at", { ascending: false })

  if (businessError) {
    throw new Error(businessError.message)
  }

  const rows = businesses ?? []
  const ownerIds = [...new Set(rows.map((business) => business.user_id).filter(Boolean))]

  let profilesById = {}
  if (ownerIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds)

    if (profileError) {
      throw new Error(profileError.message)
    }

    profilesById = (profiles ?? []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile
      return accumulator
    }, {})
  }

  let productCountByShopId = {}
  if (rows.length) {
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, shop_id")
      .in("shop_id", rows.map((business) => business.id))

    if (productError) {
      throw new Error(productError.message)
    }

    productCountByShopId = (products ?? []).reduce((accumulator, product) => {
      accumulator[product.shop_id] = (accumulator[product.shop_id] ?? 0) + 1
      return accumulator
    }, {})
  }

  return rows.map((business) => {
    const owner = profilesById[business.user_id] ?? null

    return {
      ...business,
      owner_name: owner?.full_name?.trim() || "Unknown owner",
      owner_email: owner?.email?.trim() || "No email",
      product_count: productCountByShopId[business.id] ?? 0,
      status: "Active",
    }
  })
}
