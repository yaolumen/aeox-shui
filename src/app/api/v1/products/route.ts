/**
 * GET /api/v1/products — list active products
 * Query: ?locale=en&featured=1&wuxing=wood
 */
import { NextResponse, type NextRequest } from "next/server";
import { listActiveProducts } from "@/lib/db";
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "@/lib/config";
import { pickLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const localeParam = sp.get("locale");
  const acceptLang = req.headers.get("accept-language");
  const locale: Locale = (localeParam && (SUPPORTED_LOCALES as readonly string[]).includes(localeParam)
    ? (localeParam as Locale)
    : pickLocale(acceptLang, DEFAULT_LOCALE));

  const featured = sp.get("featured") === "1";
  const wuxingFilter = sp.get("wuxing")?.toLowerCase();

  let rows = listActiveProducts(locale);
  if (featured) rows = rows.filter((r) => r.featured === 1);
  if (wuxingFilter) {
    rows = rows.filter((r) => {
      try {
        return JSON.parse(r.wuxing ?? "[]").includes(wuxingFilter);
      } catch {
        return false;
      }
    });
  }

  return NextResponse.json({
    locale,
    count: rows.length,
    products: rows.map((r) => ({
      id: r.id,
      title: locale === "zh-CN" ? (r.title_zh || r.title_en) : (r.title_en || r.title_zh),
      description: locale === "zh-CN" ? (r.description_zh || r.description_en) : (r.description_en || r.description_zh),
      category: r.category,
      url: r.url,
      price: r.price,
      tags: r.tags ? safeJson(r.tags, []) : [],
      wuxing: r.wuxing ? safeJson(r.wuxing, []) : [],
      featured: r.featured === 1,
    })),
  });
}

function safeJson<T>(s: string, fb: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
}
