"use client"

/**
 * BEGINNER NOTES
 * File: app/components/public/public-auth-shell.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { useUiLanguage } from "../ui/ui-language"

const CONTENT = {
  login: {
    badge: ["Secure Sign In", "सुरक्षित लॉग इन"],
    title: ["Return to your shop workspace", "अपने शॉप वर्कस्पेस में वापस आएं"],
    description: [
      "Open the same dashboards, stock tools, billing flow, and reports from one consistent workspace.",
      "एक ही साफ वर्कस्पेस से वही डैशबोर्ड, स्टॉक टूल, बिलिंग फ्लो और रिपोर्ट खोलें।",
    ],
    highlights: [
      ["Track shop activity with one clear overview.", "एक साफ ओवरव्यू में शॉप एक्टिविटी देखें।"],
      ["Create bills faster without losing the product context.", "प्रोडक्ट कॉन्टेक्स्ट खोए बिना जल्दी बिल बनाएं।"],
      ["Keep staff and owner workflows in the same design system.", "स्टाफ और ओनर वर्कफ्लो को एक ही डिज़ाइन सिस्टम में रखें।"],
    ],
    secondaryHref: "/register",
    secondaryLabel: ["Create account", "खाता बनाएं"],
  },
  register: {
    badge: ["Create Workspace", "वर्कस्पेस बनाएं"],
    title: ["Start your shop setup with one clean theme", "एक साफ थीम के साथ अपना शॉप सेटअप शुरू करें"],
    description: [
      "Register once, then add shops, products, staff permissions, and daily billing from the same polished experience.",
      "एक बार रजिस्टर करें, फिर उसी सुंदर अनुभव से शॉप, प्रोडक्ट, स्टाफ परमिशन और डेली बिलिंग संभालें।",
    ],
    highlights: [
      ["Set up shops and inventory without jumping between styles.", "अलग-अलग स्टाइल में जाए बिना शॉप और इन्वेंटरी सेट करें।"],
      ["Give staff the right billing and reporting access.", "स्टाफ को सही बिलिंग और रिपोर्टिंग एक्सेस दें।"],
      ["Move from welcome page to daily operations smoothly.", "वेलकम पेज से डेली ऑपरेशन तक आसानी से जाएं।"],
    ],
    secondaryHref: "/login",
    secondaryLabel: ["Go to login", "लॉग इन पर जाएं"],
  },
}

export default function PublicAuthShell({ mode = "login", children }) {
  const { copy } = useUiLanguage()
  const content = CONTENT[mode] ?? CONTENT.login

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.18)] bg-[linear-gradient(145deg,_rgba(18,32,51,0.98),_rgba(24,64,93,0.95)_48%,_rgba(47,158,107,0.9))] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-white/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[rgba(125,211,252,0.16)] blur-3xl" />

        <div className="relative">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/88">
            {copy(content.badge[0], content.badge[1])}
          </p>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            {copy(content.title[0], content.title[1])}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
            {copy(content.description[0], content.description[1])}
          </p>

          <div className="mt-8 grid gap-3">
            {content.highlights.map((item, index) => (
              <div key={item[0]} className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">0{index + 1}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-white">{copy(item[0], item[1])}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
            >
              {copy("Back to welcome", "वेलकम पेज पर वापस जाएं")}
            </Link>
            <Link
              href={content.secondaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {copy(content.secondaryLabel[0], content.secondaryLabel[1])}
            </Link>
          </div>
        </div>
      </section>

      <section className="ui-card rounded-[2rem] p-6 sm:p-8">{children}</section>
    </div>
  )
}
