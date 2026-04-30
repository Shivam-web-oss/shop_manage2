/**
 * BEGINNER NOTES
 * File: app/src/lib/admin.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

export async function getAdminBusinessDirectory(supabase) {
  // Query 1: fetch the core "business" rows.
  // Data source: Supabase table `business`.
  // Why: this table is the primary list shown in the admin directory.
  const { data: businesses, error: businessError } = await supabase
    .from("business")
    .select("id, company_name, shop_name, location, description, created_at, user_id")
    .order("created_at", { ascending: false })

  // If the database returns an error, stop early so the UI doesn't show partial/incorrect data.
  if (businessError) {
    throw new Error(businessError.message)
  }

  // Normalize `null`/`undefined` to an empty array so later logic can safely `.map()` / `.length`.
  const rows = businesses ?? []

  // We want to show the business owner's name + email in the directory.
  // `business.user_id` points to the owner in the `profiles` table.
  // This line builds a unique list of owner IDs, removing empty values.
  const ownerIds = [...new Set(rows.map((business) => business.user_id).filter(Boolean))]

  // We'll load owner profiles only if there are owners to look up.
  // This object becomes a quick lookup map: { [profileId]: profileRow }.
  let profilesById = {}
  if (ownerIds.length) {
    // Query 2: fetch owner profile details for all owners in one request.
    // Data source: Supabase table `profiles`.
    // Why: we show `owner_name` and `owner_email` in the UI.
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds)

    // Fail fast if the owner lookup fails (otherwise we'd show misleading "Unknown owner" everywhere).
    if (profileError) {
      throw new Error(profileError.message)
    }

    // Convert the profiles array into a dictionary for O(1) access by ID.
    profilesById = (profiles ?? []).reduce((accumulator, profile) => {
      accumulator[profile.id] = profile
      return accumulator
    }, {})
  }

  // We'll also show how many products each business has.
  // This map becomes: { [shopId]: productCount }.
  let productCountByShopId = {}
  if (rows.length) {
    // Query 3: fetch products that belong to the businesses we loaded.
    // Data source: Supabase table `products`.
    // Why: we count how many products each business/shop has for the admin table.
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, shop_id")
      .in("shop_id", rows.map((business) => business.id))

    // Stop if products query fails; the count is part of the UI's important information.
    if (productError) {
      throw new Error(productError.message)
    }

    // Build a count per shop_id by walking through the product rows.
    productCountByShopId = (products ?? []).reduce((accumulator, product) => {
      accumulator[product.shop_id] = (accumulator[product.shop_id] ?? 0) + 1
      return accumulator
    }, {})
  }

  // Final step: shape the data to match what the UI component expects.
  // We keep original business fields and add:
  // - `owner_name`, `owner_email` (from `profiles`)
  // - `product_count` (from `products`)
  // - `status` (currently a constant string)
  return rows.map((business) => {
    // Join business row -> profile row using `user_id`.
    const owner = profilesById[business.user_id] ?? null

    return {
      ...business,
      // Friendly fallback strings help non-technical admins understand missing data.
      owner_name: owner?.full_name?.trim() || "Unknown owner",
      owner_email: owner?.email?.trim() || "No email",
      // If a shop has no products, default the count to 0.
      product_count: productCountByShopId[business.id] ?? 0,
      // Placeholder: if you later add a `status` column in `business`,
      // you can replace this constant with that real DB value.
      status: "Active",
    }
  })
}
