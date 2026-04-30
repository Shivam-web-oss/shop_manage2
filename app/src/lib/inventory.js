/**
 * BEGINNER NOTES
 * File: app/src/lib/inventory.js
 * Purpose: Shared server/client helper functions (business logic).
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

export async function getInventoryWorkbook(supabase, userId) {
  // Step 1: load all shops for this user (these are the "tabs" of the workbook).
  // Data source: `business` table (shops owned by a business user).
  const { data: shops, error: shopsError } = await supabase
    .from("business")
    .select("id, company_name, shop_name, location, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (shopsError) {
    throw new Error(shopsError.message)
  }

  const shopRows = shops ?? []
  const shopIds = shopRows.map((shop) => shop.id)

  // If the user has no shops yet, we return an empty "products" list per shop.
  if (!shopIds.length) {
    return shopRows.map((shop) => ({ ...shop, products: [] }))
  }

  // Step 2: load all products that belong to those shops.
  // Data source: `products` table, filtered by `shop_id`.
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, shop_id, name, sku, category, unit, price, quantity, stock, updated_at")
    .in("shop_id", shopIds)
    .order("name", { ascending: true })

  if (productsError) {
    throw new Error(productsError.message)
  }

  const productsByShopId = (products ?? []).reduce((accumulator, product) => {
    const shopProducts = accumulator[product.shop_id] ?? []
    shopProducts.push({
      ...product,
      // Normalize numeric fields so the UI doesn't get strings/nulls from the DB.
      quantity: Number(product.quantity ?? product.stock ?? 0),
      stock: Number(product.quantity ?? product.stock ?? 0),
      price: Number(product.price ?? 0),
    })
    accumulator[product.shop_id] = shopProducts
    return accumulator
  }, {})

  return shopRows.map((shop) => ({
    ...shop,
    products: productsByShopId[shop.id] ?? [],
  }))
}
