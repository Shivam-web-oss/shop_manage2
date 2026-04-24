"use client"

import { useEffect, useMemo, useState } from "react"

export function useShopScope() {
  const [shops, setShops] = useState([])
  const [activeShopId, setActiveShopId] = useState("")
  const [shopLocked, setShopLocked] = useState(false)
  const [loadingShops, setLoadingShops] = useState(true)
  const [shopError, setShopError] = useState("")

  async function loadShops() {
    setLoadingShops(true)
    setShopError("")

    try {
      const response = await fetch("/api/business", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Unable to load shops.")
      }

      const rows = Array.isArray(data.shops) ? data.shops : []
      const nextLocked = data.access?.shop_locked === true
      const preferredShopId = data.access?.active_shop_id ?? rows[0]?.id ?? ""

      setShops(rows)
      setShopLocked(nextLocked)
      setActiveShopId((previous) => {
        if (nextLocked) {
          return preferredShopId
        }

        if (previous && rows.some((shop) => shop.id === previous)) {
          return previous
        }

        return preferredShopId
      })
    } catch (loadError) {
      setShops([])
      setActiveShopId("")
      setShopLocked(false)
      setShopError(loadError.message || "Unable to load shops.")
    } finally {
      setLoadingShops(false)
    }
  }

  useEffect(() => {
    loadShops()
  }, [])

  const activeShop = useMemo(() => {
    if (!shops.length) {
      return null
    }

    return shops.find((shop) => shop.id === activeShopId) ?? shops[0] ?? null
  }, [activeShopId, shops])

  return {
    shops,
    activeShop,
    activeShopId: activeShop?.id ?? activeShopId,
    setActiveShopId,
    shopLocked,
    loadingShops,
    shopError,
    reloadShops: loadShops,
  }
}
