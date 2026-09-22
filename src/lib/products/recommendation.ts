/**
 * Simplified product recommendation engine
 * Quantum Fate Lite · wuxing + tag match · supports 3 product types
 */
import productsConfig from "../../../config/products.json";
import {
  listActiveProducts,
  upsertProduct,
  type ProductRow,
} from "@/lib/db";
import type { FateAnalysis } from "@/lib/fate-analysis";
import type { Locale } from "@/lib/config";

interface WxConfig {
  en: string;
  "zh-CN": string;
  tags: string[];
  keywords: string[];
}

const WUXING_CFG = productsConfig.wuxing as Record<string, WxConfig>;

export interface RecommendInput {
  analysis: Pick<
    FateAnalysis,
    "favorableElements" | "unfavorableElements" | "dayMasterWuxing" | "wuxing"
  >;
  locale: Locale;
  limit?: number;
  featuredFirst?: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  productType: string;
  url: string;
  price: string | null;
  deliveryInfo: Record<string, string> | null;
  matchScore: number;
  matchReasons: string[];
}

const REASONS_EN: Record<string, string> = {
  favorable: "Aligns with your favorable elements",
  avoid: "Helps balance elements you may want to observe",
  dayMaster: "Resonates with your day-master element",
  tag: "Matches your cultural interests",
};

const REASONS_ZH: Record<string, string> = {
  favorable: "契合你的能量催化剂元素",
  avoid: "有助于调和需要关注的元素",
  dayMaster: "与日主元素相呼应",
  tag: "匹配你的文化兴趣",
};

function pickTitle(p: ProductRow, locale: Locale): string {
  if (locale === "zh-CN") return p.title_zh || p.title_en || p.id;
  return p.title_en || p.title_zh || p.id;
}

function pickDescription(p: ProductRow, locale: Locale): string {
  const en = p.description_en ?? "";
  const zh = p.description_zh ?? "";
  if (locale === "zh-CN") return zh || en;
  return en || zh;
}

function safeParse<T>(s: string | null, fb: T): T {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
}

export function recommend(input: RecommendInput): Recommendation[] {
  const limit = input.limit ?? 4;
  const reasons =
    input.locale === "zh-CN" ? REASONS_ZH : REASONS_EN;

  let products = listActiveProducts(input.locale);
  if (products.length === 0) {
    const samples = productsConfig.samples as Array<Record<string, unknown>>;
    products = samples.map((s, i) => {
      const title = (s.title as Record<string, string> | undefined) ?? {};
      const desc = (s.description as Record<string, string> | undefined) ?? {};
      return {
        id: String(s.id),
        title_en: title.en ?? "",
        title_zh: title["zh-CN"] ?? "",
        description_en: desc.en ?? null,
        description_zh: desc["zh-CN"] ?? null,
        category: String(s.category ?? ""),
      product_type: String((s as Record<string, unknown>).productType ?? "online"),
        url: String(s.url ?? ""),
        price: (s.price as string | undefined) ?? null,
        delivery_info: null,
        tags: JSON.stringify((s.tags as string[] | undefined) ?? []),
        wuxing: JSON.stringify((s.wuxing as string[] | undefined) ?? []),
        locales: JSON.stringify((s.locale as string[] | undefined) ?? []),
        featured: s.featured ? 1 : 0,
        active: s.active === false ? 0 : 1,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
      } as ProductRow;
    });
  }

  const favorable = new Set(input.analysis.favorableElements);
  const avoid = new Set(input.analysis.unfavorableElements);
  const dayMaster = input.analysis.dayMasterWuxing;

  const scored = products.map((p) => {
    const tags = safeParse<string[]>(p.tags, []);
    const wxs = safeParse<string[]>(p.wuxing, []);

    let score = 0;
    const reasonsHit: string[] = [];

    for (const w of wxs) {
      if (favorable.has(w)) {
        score += 3;
        reasonsHit.push(reasons.favorable);
      } else if (avoid.has(w)) {
        score -= 1;
      } else if (w === dayMaster) {
        score += 2;
        reasonsHit.push(reasons.dayMaster);
      }
    }
    const cfgEntries = Object.entries(WUXING_CFG);
    for (const tag of tags) {
      for (const [k, cfg] of cfgEntries) {
        if (favorable.has(k) && cfg.keywords.includes(tag)) {
          score += 1;
          if (!reasonsHit.includes(reasons.tag)) reasonsHit.push(reasons.tag);
        }
      }
    }
    if (p.featured === 1 && input.featuredFirst) score += 0.5;
    return { product: p, score, reasons: Array.from(new Set(reasonsHit)) };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => ({
    id: s.product.id,
    title: pickTitle(s.product, input.locale),
    description: pickDescription(s.product, input.locale) || null,
    category: s.product.category,
    productType: s.product.product_type || "online",
    url: s.product.url,
    price: s.product.price,
    deliveryInfo: s.product.delivery_info
      ? safeParse<Record<string, string>>(s.product.delivery_info, {})
      : null,
    matchScore: s.score,
    matchReasons: s.reasons,
  }));
}

let _seeded = false;

export function ensureSeedProducts(): void {
  if (_seeded) return;
  _seeded = true;
  const samples = productsConfig.samples as Array<Record<string, unknown>>;
  const existing = listActiveProducts();
  const existingIds = new Set(existing.map((p) => p.id));
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const id = String(s.id);
    if (existingIds.has(id)) continue;
    const title = (s.title as Record<string, string> | undefined) ?? {};
    const desc = (s.description as Record<string, string> | undefined) ?? {};
    const row: ProductRow = {
      id,
      title_en: title.en ?? "",
      title_zh: title["zh-CN"] ?? "",
      description_en: desc.en ?? null,
      description_zh: desc["zh-CN"] ?? null,
      category: String(s.category ?? ""),
      product_type: String((s as Record<string, unknown>).productType ?? "affiliate"),
      url: String(s.url ?? ""),
      price: (s.price as string | undefined) ?? null,
      delivery_info: null,
      tags: JSON.stringify((s.tags as string[] | undefined) ?? []),
      wuxing: JSON.stringify((s.wuxing as string[] | undefined) ?? []),
      locales: JSON.stringify((s.locale as string[] | undefined) ?? []),
      featured: s.featured ? 1 : 0,
      active: s.active === false ? 0 : 1,
      sort_order: i,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    try {
      upsertProduct(row);
    } catch {
    }
  }
}
