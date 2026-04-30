"use client"

/**
 * BEGINNER NOTES
 * File: app/components/public/public-welcome.jsx
 * Purpose: Reusable UI component used by pages.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

import Link from "next/link"
import { useUiLanguage } from "../ui/ui-language"

const METRICS = [
  {
    value: ["One", "एक"],
    label: ["shared visual system", "साझा विजुअल सिस्टम"],
  },
  {
    value: ["Live", "लाइव"],
    label: ["billing and stock workflow", "बिलिंग और स्टॉक वर्कफ्लो"],
  },
  {
    value: ["Daily", "रोज़ाना"],
    label: ["reports that stay readable", "पढ़ने योग्य रिपोर्ट"],
  },
]

const FLOW_STEPS = [
  {
    step: "01",
    title: ["Welcome that explains the product quickly", "वेलकम स्क्रीन जो प्रोडक्ट को जल्दी समझाए"],
    description: [
      "Owners and staff land on the same visual language, so the product feels trustworthy from the first screen.",
      "ओनर और स्टाफ दोनों एक ही विजुअल भाषा पर आते हैं, इसलिए पहला स्क्रीन ही भरोसा देता है।",
    ],
  },
  {
    step: "02",
    title: ["Authentication that looks connected", "ऐसा ऑथ स्क्रीन जो उसी थीम का हिस्सा लगे"],
    description: [
      "Login and register pages now feel like part of the same workspace instead of isolated forms.",
      "लॉग इन और रजिस्टर पेज अब अलग फॉर्म नहीं, उसी वर्कस्पेस का हिस्सा लगते हैं।",
    ],
  },
  {
    step: "03",
    title: ["Operations that stay calm and readable", "ऐसे ऑपरेशन स्क्रीन जो साफ और शांत रहें"],
    description: [
      "Cards, buttons, panels, and navigation all use the same design rhythm across billing, stock, and reports.",
      "कार्ड, बटन, पैनल और नेविगेशन बिलिंग, स्टॉक और रिपोर्ट में एक ही डिज़ाइन रिदम रखते हैं।",
    ],
  },
]

const ROLE_CARDS = [
  {
    title: ["For business owners", "बिजनेस ओनर के लिए"],
    description: [
      "See shop performance, stock pressure, and team activity without jumping between different-looking pages.",
      "अलग-अलग दिखने वाले पेज बदले बिना शॉप परफॉर्मेंस, स्टॉक प्रेशर और टीम एक्टिविटी देखें।",
    ],
  },
  {
    title: ["For staff teams", "स्टाफ टीम के लिए"],
    description: [
      "Create bills, update stock, and open reports in a simpler flow that keeps the focus on the task.",
      "ऐसे आसान फ्लो में बिल बनाएं, स्टॉक अपडेट करें और रिपोर्ट खोलें जिसमें ध्यान काम पर रहे।",
    ],
  },
  {
    title: ["For daily routines", "रोज़मर्रा के काम के लिए"],
    description: [
      "The same spacing, shadows, controls, and hierarchy now carry through the public and private experience.",
      "अब वही स्पेसिंग, शैडो, कंट्रोल और हाइरार्की पब्लिक और प्राइवेट दोनों अनुभवों में रहती है।",
    ],
  },
]

const ENTRY_POINTS = [
  {
    href: "/login",
    title: ["Sign in to your workspace", "अपने वर्कस्पेस में साइन इन करें"],
    description: [
      "Open your existing dashboard, products, billing, and reports.",
      "अपना मौजूदा डैशबोर्ड, प्रोडक्ट, बिलिंग और रिपोर्ट खोलें।",
    ],
    cta: ["Login", "लॉग इन"],
  },
  {
    href: "/register",
    title: ["Create a new account", "नया खाता बनाएं"],
    description: [
      "Start setting up your shops, staff permissions, and daily workflow.",
      "अपनी शॉप, स्टाफ परमिशन और डेली वर्कफ्लो सेट करना शुरू करें।",
    ],
    cta: ["Register", "रजिस्टर करें"],
  },
]

export default function PublicWelcome() {
  const { copy } = useUiLanguage()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.18)] bg-[linear-gradient(145deg,_rgba(18,32,51,0.98),_rgba(20,57,83,0.96)_42%,_rgba(47,158,107,0.88))] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.2)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_58%)]" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-[rgba(96,165,250,0.16)] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[rgba(255,255,255,0.12)] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/82">
              {copy("Welcome To ShopManager", "शॉपमैनेजर में आपका स्वागत है")}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {copy("A cleaner start for billing, inventory, and daily shop work.", "बिलिंग, इन्वेंटरी और रोज़मर्रा के शॉप काम के लिए एक साफ शुरुआत।")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">
              {copy(
                "This welcome page now leads directly into the same theme used across the app, so login, register, and the private workspace all feel connected.",
                "यह वेलकम पेज अब सीधे उसी थीम में ले जाता है जो पूरे ऐप में इस्तेमाल होती है, इसलिए लॉग इन, रजिस्टर और प्राइवेट वर्कस्पेस सब एक जैसे लगते हैं।"
              )}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="ui-btn-primary px-6 py-3 text-sm sm:text-base">
                {copy("Create your account", "अपना खाता बनाएं")}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/16 sm:text-base"
              >
                {copy("Go to login", "लॉग इन पर जाएं")}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {METRICS.map((metric) => (
                <div key={metric.value[0]} className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-white">{copy(metric.value[0], metric.value[1])}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{copy(metric.label[0], metric.label[1])}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="ui-card rounded-[1.75rem] border-white/40 bg-[rgba(255,255,255,0.96)] p-5 sm:p-6">
            <p className="ui-eyebrow">{copy("Start Here", "यहां से शुरू करें")}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {copy("Choose your next step", "अपना अगला कदम चुनें")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
              {copy(
                "Use the same welcome theme to either sign in to an existing workspace or create a new one.",
                "उसी वेलकम थीम में या तो अपने मौजूदा वर्कस्पेस में साइन इन करें या नया वर्कस्पेस बनाएं।"
              )}
            </p>

            <div className="mt-5 grid gap-3">
              {ENTRY_POINTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.5rem] border border-[var(--border)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-lg font-semibold text-[var(--foreground)]">{copy(item.title[0], item.title[1])}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{copy(item.description[0], item.description[1])}</p>
                  <p className="mt-4 text-sm font-semibold text-[var(--accent-deep)]">{copy(item.cta[0], item.cta[1])}</p>
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {copy("What this workspace covers", "यह वर्कस्पेस क्या संभालता है")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  copy("Inventory", "इन्वेंटरी"),
                  copy("Billing", "बिलिंग"),
                  copy("Reports", "रिपोर्ट"),
                  copy("Teams", "टीम"),
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex rounded-full border border-[rgba(47,158,107,0.2)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-deep)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="results" className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="ui-card rounded-[2rem] p-6 sm:p-8">
          <p className="ui-eyebrow">{copy("Same Theme Everywhere", "हर जगह वही थीम")}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {copy("One visual rhythm from welcome to work", "वेलकम से काम तक एक ही विजुअल रिदम")}
          </h2>
          <div className="mt-6 grid gap-4">
            {FLOW_STEPS.map((item) => (
              <div key={item.step} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">{item.step}</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{copy(item.title[0], item.title[1])}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{copy(item.description[0], item.description[1])}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="impact" className="ui-card rounded-[2rem] p-6 sm:p-8">
          <p className="ui-eyebrow">{copy("Welcome Experience", "वेलकम अनुभव")}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {copy("Built for owners, staff, and everyday routines", "ओनर, स्टाफ और रोज़मर्रा के काम के लिए बनाया गया")}
          </h2>
          <div className="mt-6 grid gap-4">
            {ROLE_CARDS.map((item) => (
              <div key={item.title[0]} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">{copy(item.title[0], item.title[1])}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{copy(item.description[0], item.description[1])}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
