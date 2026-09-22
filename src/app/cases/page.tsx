import Link from "next/link";
import { headers, cookies } from "next/headers";
import { Disclaimer } from "@/components/Disclaimer";
import { NavBar } from "@/components/NavBar";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";

export const dynamic = "force-dynamic";

const T = {
  en: {
    title: "Sample Reports",
    subtitle: "Example energy cycle analyses, anonymized.",
    note: "These are sample (placeholder) entries for the Phase 1 demo. Real reports are generated on demand via the /analyze form.",
    back: "Decode your own →",
    samples: [
      { id: "demo-1", title: "Foundation · Wood Core Element", tags: "wood · spring · growth" },
      { id: "demo-2", title: "Foundation · Water Core Element", tags: "water · winter · flow" },
      { id: "demo-3", title: "Foundation · Earth Core Element", tags: "earth · transitions · stability" },
    ],
  },
  "zh-CN": {
    title: "示例报告",
    subtitle: "匿名化的能量周期分析示例。",
    note: "这些是 Phase 1 演示的占位条目。真实报告通过 /analyze 表单按需生成。",
    back: "解码你的能量周期 →",
    samples: [
      { id: "demo-1", title: "基础版 · 木核心元素", tags: "木 · 春 · 生长" },
      { id: "demo-2", title: "基础版 · 水核心元素", tags: "水 · 冬 · 流动" },
      { id: "demo-3", title: "基础版 · 土核心元素", tags: "土 · 季月 · 稳定" },
    ],
  },
} as const;

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE);
  const t = T[locale];

  return (
    <>
      <NavBar locale={locale} />
      <main className="container mx-auto min-h-screen px-5 py-8 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <Disclaimer variant="banner" locale={locale} />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">{t.note}</p>

        <ul className="space-y-2">
          {t.samples.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {s.title}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.tags}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href={`/analyze?lang=${locale}`}
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t.back}
        </Link>

        <Disclaimer variant="inline" locale={locale} />
      </div>
    </main>
    </>
  );
}
