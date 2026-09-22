/**
 * /recent · 找回最近的报告（按 IP 列出最近 24h 的 5 份）
 * Quantum Fate Lite
 */
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { listRecentByIp } from "@/lib/db";
import { Disclaimer } from "@/components/Disclaimer";
import { NavBar } from "@/components/NavBar";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COPY = {
  en: {
    title: "Your Recent Reports",
    subtitle: "Last 5 reports generated from your IP in the past 24 hours.",
    empty: "No recent reports found. Try generating one on the decode page.",
    cta: "Decode your energy cycle",
    ago: "ago",
    view: "Open report",
    back: "Back to home",
    locale: "en",
  },
  "zh-CN": {
    title: "您最近的报告",
    subtitle: "过去 24 小时内您 IP 下的最近 5 份报告。",
    empty: "暂无最近的报告，请前往解码页生成一份。",
    cta: "解码你的能量周期",
    ago: "前",
    view: "查看报告",
    back: "返回首页",
    locale: "zh-CN",
  },
} as const;

function timeAgo(ts: number, locale: "en" | "zh-CN"): string {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return locale === "zh-CN" ? "刚刚" : "just now";
  if (min < 60) return locale === "zh-CN" ? `${min} 分钟${COPY[locale].ago}` : `${min} min ${COPY[locale].ago}`;
  const hr = Math.floor(min / 60);
  return locale === "zh-CN" ? `${hr} 小时${COPY[locale].ago}` : `${hr} hr ${COPY[locale].ago}`;
}

export default async function RecentPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const h = await headers();
  const al = h.get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE) as "en" | "zh-CN";
  const t = COPY[locale];

  // We need an IP. The route is rendered server-side, so derive IP from
  // headers the same way the API does. getClientIp is from "next/server"
  // but we can re-implement here for the page.
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = (xff.split(",")[0] ?? "").trim() || h.get("x-real-ip") || "local";

  const reports = listRecentByIp(ip, 24 * 60 * 60 * 1000, 5);

  return (
    <>
      <NavBar locale={locale} />
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-5 py-8 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-4 sm:py-12">
      <div className="container mx-auto max-w-2xl space-y-6">
        <Disclaimer variant="inline" locale={locale} />

        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t.title}
          </h1>
          <Link
            href={`/?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← {t.back}
          </Link>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.subtitle}
        </p>

        {reports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white/40 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-zinc-600 dark:text-zinc-400">{t.empty}</p>
            <Link
              href={`/analyze?lang=${locale}`}
              className="mt-4 inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t.cta}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <code className="font-mono text-xs text-zinc-500">
                      {r.id.slice(0, 8)}
                    </code>
                    <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {r.birth_date} · {String(r.birth_hour).padStart(2, "0")}:00 ·{" "}
                      {r.gender} · {r.locale}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {r.ai_provider} · {r.ai_model} · {timeAgo(r.created_at, locale)}
                    </div>
                  </div>
                  <Link
                    href={`/report/${r.id}?lang=${locale}`}
                    className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                  >
                    {t.view} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
    </>
  );
}
