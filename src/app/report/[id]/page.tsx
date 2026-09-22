import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { ReportView } from "@/components/ReportView";
import { NavBar } from "@/components/NavBar";
import { loadReport } from "@/lib/report-service";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";
import { getSettingOrDefault, getStylePreset } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function ReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { lang } = await searchParams;
  const data = loadReport(id);
  if (!data) notFound();
  const { row, analysis, recommendations } = data;

  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE);
  const monetizationMode = getSettingOrDefault("monetization_mode");
  const reportTtlHours = parseInt(getSettingOrDefault("report_ttl_hours"), 10) || 24;
  const stylePreset = getStylePreset();

  return (
    <>
      <NavBar locale={locale} />
      <main className="container mx-auto min-h-screen px-5 py-8 sm:px-4 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <ReportView
            id={row.id}
            locale={locale}
          content={row.content}
          analysis={{
            baziString: analysis.baziString,
            wuxing: analysis.wuxing,
            dayMaster: analysis.dayMaster,
            dayMasterWuxing: analysis.dayMasterWuxing,
            dayMasterStrength: analysis.dayMasterStrength,
            favorableElements: analysis.favorableElements,
            unfavorableElements: analysis.unfavorableElements,
          }}
          recommendations={recommendations}
          ai={{
            provider: row.ai_provider,
            model: row.ai_model,
            latencyMs: row.ai_latency_ms,
          }}
          fateBook={row.fate_book}
          tier={row.report_tier || "free"}
          createdAt={row.created_at}
           monetizationMode={monetizationMode}
           ttlHours={reportTtlHours}
           style={stylePreset}
         />
      </div>
    </main>
    </>
  );
}
