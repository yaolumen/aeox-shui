import { headers, cookies } from "next/headers";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { NavBar } from "@/components/NavBar";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";
import { getSettingOrDefault } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const h = await headers();
  const al = h.get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE);
  const monetizationMode = getSettingOrDefault("monetization_mode");

  return (
    <>
      <NavBar locale={locale} />
      <main className="container mx-auto min-h-screen px-5 py-8 sm:px-4 sm:py-12">
        <AnalyzeForm defaultLocale={locale as "en" | "zh-CN"} monetizationMode={monetizationMode} />
      </main>
    </>
  );
}
