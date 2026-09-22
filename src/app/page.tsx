import Link from "next/link";
import { headers, cookies } from "next/headers";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";
import { getSettingOrDefault } from "@/lib/settings";

export const dynamic = "force-dynamic";

const T = {
  en: {
    brand: "Shui",
    brandSub: "Decode Your Personal Energy Cycle",
    desc: "Align your living space with natural time-rhythms and classical environmental philosophy.",
    cta: "Decode Now",
    privacyNote: "Privacy-first: data auto-purged in 24h",
    samples: "View Sample Reports →",
    footer: "© 2026 Shui by AEOX (YAOLUMEN TECHNOLOGIES LTD). All rights reserved.",
  },
  "zh-CN": {
    brand: "水 · 节律",
    brandSub: "解码你的个人能量周期",
    desc: "利用经典环境算法与节律哲学，调和你的居住空间与生活节奏。",
    cta: "立即解码",
    privacyNote: "隐私优先：数据 24 小时自动清除",
    samples: "查看示例报告 →",
    footer: "© 2026 水 · 节律 by AEOX (YAOLUMEN TECHNOLOGIES LTD). All rights reserved.",
  },
} as const;

const ICONS = [
  { emoji: "🌿", delay: "0s", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { emoji: "🔥", delay: "0.4s", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { emoji: "⛰️", delay: "0.8s", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { emoji: "🪙", delay: "1.2s", cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  { emoji: "💧", delay: "1.6s", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang: queryLang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, queryLang, DEFAULT_LOCALE);
  const t = T[locale];
  const brandName = locale === "zh-CN"
    ? (getSettingOrDefault("site_brand_title_zh") || t.brand)
    : (getSettingOrDefault("site_brand_title") || t.brand);
  const brandSub = locale === "zh-CN"
    ? (getSettingOrDefault("site_brand_subtitle_zh") || t.brandSub)
    : (getSettingOrDefault("site_brand_subtitle") || t.brandSub);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-violet-50 animate-bg-flow dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-2">
              {(["en", "zh-CN"] as const).map((l) => (
                <Link
                  key={l}
                  href={`/?lang=${l}`}
                  className={`rounded-lg px-4 py-1.5 sm:px-2.5 sm:py-0.5 text-sm sm:text-xs font-medium transition-colors min-h-[40px] sm:min-h-0 inline-flex items-center justify-center ${
                    locale === l
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {l === "en" ? "EN" : "中"}
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              {brandName}
            </h1>
            <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
              {brandSub}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-2xl" aria-hidden="true">
            {ICONS.map((ic, i) => (
              <span
                key={i}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${ic.cls} animate-icon-float`}
                style={{ animationDelay: ic.delay }}
              >
                {ic.emoji}
              </span>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t.desc}
          </p>

          <Link
            href={`/analyze?lang=${locale}`}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 active:scale-[0.98] animate-cta-pulse"
          >
            {t.cta}
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t.privacyNote}
          </div>

          <Link
            href={`/cases?lang=${locale}`}
            className="block text-center text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t.samples}
          </Link>
        </div>
      </div>

      <footer className="border-t border-zinc-100 px-5 py-5 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        <p>{t.footer}</p>
        <div className="mt-2 flex items-center justify-center gap-4 sm:gap-3">
          <Link href={`/privacy?lang=${locale}`} className="text-sm sm:text-xs hover:underline">{locale === "zh-CN" ? "隐私" : "Privacy"}</Link>
          <Link href={`/terms?lang=${locale}`} className="text-sm sm:text-xs hover:underline">{locale === "zh-CN" ? "条款" : "Terms"}</Link>
          <Link href={`/faq?lang=${locale}`} className="text-sm sm:text-xs hover:underline">{locale === "zh-CN" ? "常见问题" : "FAQ"}</Link>
          <Link href={`/about?lang=${locale}`} className="text-sm sm:text-xs hover:underline">{locale === "zh-CN" ? "关于" : "About"}</Link>
        </div>
      </footer>
    </main>
  );
}
