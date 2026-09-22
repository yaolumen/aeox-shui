/**
 * GET /api/v1/config — public site config (no secrets)
 */
import { NextResponse } from "next/server";
import { generalConfig, seoConfig, promptsConfig, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/config";
import { getSettingOrDefault, getStylePreset } from "@/lib/settings";
import { listEnabledReportCycles } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const brandTitle = getSettingOrDefault("site_brand_title") || generalConfig.brand.name;
  const brandTitleZh = getSettingOrDefault("site_brand_title_zh") || generalConfig.brand.nameZh;
  const brandSubtitle = getSettingOrDefault("site_brand_subtitle") || generalConfig.brand.tagline;
  const brandSubtitleZh = getSettingOrDefault("site_brand_subtitle_zh") || generalConfig.brand.taglineZh;

  return NextResponse.json({
    brand: {
      name: brandTitle,
      nameZh: brandTitleZh,
      tagline: brandSubtitle,
      taglineZh: brandSubtitleZh,
      subTagline: generalConfig.brand.subTagline,
    },
    i18n: {
      defaultLocale: getSettingOrDefault("site_default_locale") || DEFAULT_LOCALE,
      supportedLocales: SUPPORTED_LOCALES,
      localeLabels: generalConfig.i18n.localeLabels,
    },
    seo: {
      title: seoConfig.site.title,
      titleAlt: seoConfig.site.titleAlt,
      description: seoConfig.site.description,
      descriptionAlt: seoConfig.site.descriptionAlt,
      keywords: seoConfig.site.keywords,
    },
    monetization: {
      mode: getSettingOrDefault("monetization_mode"),
      showProducts: getSettingOrDefault("show_product_recommendations") === "1",
    },
    templates: Object.fromEntries(
      Object.entries(promptsConfig.templates as Record<string, unknown>).map(([k, v]) => {
        const tpl = v as { name?: unknown; enabled?: unknown; description?: unknown; sections?: unknown };
        return [
          k,
          {
            name: tpl.name,
            enabled: tpl.enabled !== false,
            description: tpl.description,
            sections: Array.isArray(tpl.sections) ? tpl.sections : [],
          },
        ];
      })
    ),
    features: generalConfig.features,
    version: generalConfig.version,
    aiScheduling: getSettingOrDefault("ai_scheduling_mode"),
    style: getStylePreset(),
    cycles: listEnabledReportCycles().map((c) => ({
      id: c.id,
      nameEn: c.name_en,
      nameZh: c.name_zh,
      years: c.years,
    })),
  });
}
