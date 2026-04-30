"use client"

/**
 * BEGINNER NOTES
 * File: app/components/ui/language-toggle.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

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
