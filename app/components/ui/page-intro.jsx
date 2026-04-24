"use client"

import Link from "next/link"
import { useUiLanguage } from "./ui-language"

export default function PageIntro({
  eyebrow,
  eyebrowHi,
  title,
  titleHi,
  description,
  descriptionHi,
  backHref,
  backLabel = "Back",
  backLabelHi = "वापस जाएं",
}) {
  const { copy } = useUiLanguage()

  return (
    <>
      <p className="ui-eyebrow">{copy(eyebrow, eyebrowHi)}</p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
        {copy(title, titleHi)}
      </h1>
      <p className="mt-2 max-w-3xl text-base text-[var(--ink-muted)]">{copy(description, descriptionHi)}</p>
      <div className="mt-4">
        <Link href={backHref} className="ui-btn-secondary px-4 py-2 text-sm">
          {copy(backLabel, backLabelHi)}
        </Link>
      </div>
    </>
  )
}
