"use client"

import { useUiLanguage } from "./ui-language"

export default function LanguageToggle({ className = "" }) {
  const { copy, isHindi, toggleLanguage } = useUiLanguage()

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] ${className}`.trim()}
      aria-label={copy("Switch to Hindi", "अंग्रेज़ी में बदलें")}
      title={copy("Switch to Hindi", "अंग्रेज़ी में बदलें")}
    >
      {isHindi ? "English" : "हिंदी"}
    </button>
  )
}
