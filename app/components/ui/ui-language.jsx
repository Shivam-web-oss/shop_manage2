"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "shop-manager-language"
const UiLanguageContext = createContext(null)

function normalizeLanguage(value) {
  return value === "hi" ? "hi" : "en"
}

function toDate(value) {
  if (!value) {
    return null
  }

  const parsedDate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function UiLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") {
      return "en"
    }

    try {
      const storedLanguage = window.localStorage.getItem(STORAGE_KEY)
      if (storedLanguage) {
        return normalizeLanguage(storedLanguage)
      }

      if (window.navigator.language?.toLowerCase().startsWith("hi")) {
        return "hi"
      }
    } catch {
      // Ignore storage access errors and keep the default language.
    }

    return "en"
  })

  useEffect(() => {
    const nextLanguage = normalizeLanguage(language)
    document.documentElement.lang = nextLanguage
    document.documentElement.dataset.language = nextLanguage

    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage)
    } catch {
      // Ignore storage write errors.
    }
  }, [language])

  const value = useMemo(() => {
    const nextLanguage = normalizeLanguage(language)
    const locale = nextLanguage === "hi" ? "hi-IN" : "en-IN"
    const copy = (english, hindi) => (nextLanguage === "hi" ? hindi : english)

    return {
      language: nextLanguage,
      isHindi: nextLanguage === "hi",
      copy,
      setLanguage(nextLanguageValue) {
        setLanguageState(normalizeLanguage(nextLanguageValue))
      },
      toggleLanguage() {
        setLanguageState((previous) => (previous === "hi" ? "en" : "hi"))
      },
      formatCurrency(value) {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value ?? 0))
      },
      formatNumber(value, options = {}) {
        return new Intl.NumberFormat(locale, options).format(Number(value ?? 0))
      },
      formatDate(value, options = {}) {
        const dateValue = toDate(value)
        if (!dateValue) {
          return copy("N/A", "उपलब्ध नहीं")
        }

        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
          ...options,
        }).format(dateValue)
      },
      formatDateTime(value, options = {}) {
        const dateValue = toDate(value)
        if (!dateValue) {
          return copy("N/A", "उपलब्ध नहीं")
        }

        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          ...options,
        }).format(dateValue)
      },
    }
  }, [language])

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext)

  if (!context) {
    throw new Error("useUiLanguage must be used inside UiLanguageProvider.")
  }

  return context
}
