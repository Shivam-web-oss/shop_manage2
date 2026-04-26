export async function getInventoryWorkbook(supabase, userId) {
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

  if (!shopIds.length) {
    return shopRows.map((shop) => ({ ...shop, products: [] }))
  }

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
