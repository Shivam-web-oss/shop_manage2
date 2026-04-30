"use client"

/**
 * BEGINNER NOTES
 * File: app/components/business/business-overview-shell.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import ActivityBoard from "./activity-board"
import { useUiLanguage } from "../ui/ui-language"

export default function BusinessOverviewShell({ shops }) {
  const { copy, formatDate } = useUiLanguage()

  const quickActions = [
    {
      href: "/business/create",
      step: "1",
      title: copy("Add a shop", "दुकान जोड़ें"),
      description: copy("Start by saving your shop name and place.", "पहले दुकान का नाम और जगह लिखें।"),
    },
    {
      href: "/business/orders",
      step: "2",
      title: copy("Add your items", "सामान जोड़ें"),
      description: copy("Save the things you sell with price and count.", "जो सामान बेचते हैं उसे दाम और गिनती के साथ जोड़ें।"),
    },
    {
      href: "/business/staff",
      step: "3",
      title: copy("Choose your team", "टीम चुनें"),
      description: copy("Make staff accounts and pick what they can do.", "स्टाफ बनाएं और तय करें कि वे क्या कर सकते हैं।"),
    },
    {
      href: "/employee/bill",
      step: "4",
      title: copy("Make a bill", "बिल बनाएं"),
      description: copy("Pick items and create a customer bill fast.", "सामान चुनें और जल्दी से ग्राहक का बिल बनाएं।"),
    },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="ui-card rounded-3xl p-6 sm:p-8">
        <p className="ui-eyebrow">{copy("Easy Business Home", "आसान बिज़नेस होम")}</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
          {copy("What do you want to do today?", "आज आप क्या करना चाहते हैं?")}
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--ink-muted)]">
          {copy(
            "Pick one simple card below. Each step is kept short so anyone can follow it easily.",
            "नीचे से एक आसान कार्ड चुनें। हर काम छोटा रखा गया है ताकि कोई भी आसानी से कर सके।"
          )}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="ui-panel rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent-deep)]">
                {action.step}
              </span>
              <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="ui-card rounded-3xl p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-eyebrow">{copy("Your Shops", "आपकी दुकानें")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {copy("Tap a shop to edit it", "दुकान पर टैप करें और बदलें")}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {copy("You can open any shop card below.", "नीचे किसी भी दुकान के कार्ड को खोल सकते हैं।")}
            </p>
          </div>
          <p className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
            {copy(`${shops.length} shop(s)`, `${shops.length} दुकान`)}
          </p>
        </div>

        {shops.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--ink-muted)]">
            {copy(
              "No shop yet. Press Add a shop above and fill just three small details.",
              "अभी कोई दुकान नहीं है। ऊपर दुकान जोड़ें दबाएं और बस तीन छोटी जानकारी भरें।"
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/business/shops/${shop.id}`}
                className="rounded-3xl border border-[var(--border)] bg-white p-5 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">{shop.company_name}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{shop.shop_name}</p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">{shop.location}</p>
                <p className="mt-3 text-sm text-[var(--ink-muted)]">
                  {copy("Created on", "बनी थी")} {formatDate(shop.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ui-card rounded-3xl p-6">
        <p className="ui-eyebrow">{copy("Live Updates", "ताज़ा जानकारी")}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          {copy("See today’s work in one place", "आज का काम एक जगह देखें")}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {copy(
            "Billing, stock changes, and shop activity are shown below in simple cards.",
            "बिल, स्टॉक बदलाव और दुकान की जानकारी नीचे आसान कार्ड में दिखती है।"
          )}
        </p>
        <div className="mt-5">
          <ActivityBoard limit={20} />
        </div>
      </section>
    </div>
  )
}
