/**
 * Report generation pipeline
 * Quantum Fate Lite · analyzeFate → AI call → persist
 * Supports free / premium tiers and credit-based redemption
 */
import { randomUUID } from "node:crypto";
import { analyzeFate, type FateAnalysis, type FateInput } from "@/lib/fate-analysis";
import { generate as generateAI, type AIResponse } from "@/lib/ai";
import { getSystemPrompt, renderTemplate, type Locale } from "@/lib/config";
import { insertReport, getReport, logEvent, getCreditByCode, markCreditUsed, type ReportRow } from "@/lib/db";
import { getSettingOrDefault } from "@/lib/settings";
import { recommend } from "@/lib/products/recommendation";
import {
  formatBaziString,
  formatWuxingString,
  formatShichenName,
  formatDayMaster,
  formatFavorableElements,
  formatStrengthLabel,
  formatLiunianPillars,
} from "@/lib/bazi/i18n-terms";

export interface GenerateReportInput extends FateInput {
  locale: Locale;
  template?: string;
  fateBook?: string;
  cachedAnalysis?: FateAnalysis;
  ip?: string;
  tier?: "free" | "premium";
  creditCode?: string;
  cycleYears?: number;
}

export interface GeneratedReport {
  id: string;
  analysis: FateAnalysis;
  content: string;
  ai: Pick<AIResponse, "provider" | "model" | "latencyMs" | "usage">;
  recommendations: ReturnType<typeof recommend>;
  template: string;
  fateBook: string;
  tier: string;
  createdAt: number;
  durationMs: number;
}

const DEFAULT_TEMPLATE = "foundation";
const DEFAULT_BOOK = "sanming";

export function validateCreditCode(code: string): {
  valid: boolean;
  tier?: string;
  error?: string;
} {
  const credit = getCreditByCode(code);
  if (!credit) return { valid: false, error: "code_not_found" };
  if (credit.used && credit.credits <= 0) return { valid: false, error: "code_already_used" };
  if (credit.expires_at && credit.expires_at < Date.now()) {
    return { valid: false, error: "code_expired" };
  }
  return { valid: true, tier: credit.tier };
}

export async function generateReport(
  input: GenerateReportInput
): Promise<GeneratedReport> {
  const t0 = Date.now();
  const tier = input.tier ?? "free";
  let template = input.template ?? DEFAULT_TEMPLATE;
  const fateBook = input.fateBook ?? DEFAULT_BOOK;
  const locale = input.locale;

  if (tier === "premium" && template === DEFAULT_TEMPLATE) {
    const premiumTemplate = getSettingOrDefault("premium_template");
    template = premiumTemplate || "premium";
  }

  if (input.creditCode) {
    const validation = validateCreditCode(input.creditCode);
    if (!validation.valid) {
      throw new Error(`Credit code invalid: ${validation.error}`);
    }
  }

  const analysis = input.cachedAnalysis ?? analyzeFate({ ...input, cycleYears: input.cycleYears });

  const systemPrompt = getSystemPrompt(locale);
  const maxTokens = tier === "premium"
    ? parseInt(getSettingOrDefault("premium_max_tokens"), 10) || 4096
    : 2048;

  const baziFormatted = formatBaziString(analysis.bazi, locale);
  const wuxingFormatted = formatWuxingString(analysis.wuxing, locale);
  const shichenFormatted = formatShichenName(analysis.shichenName, locale);
  const dayMasterFormatted = formatDayMaster(analysis.dayMaster, locale);
  const favorableFormatted = formatFavorableElements(analysis.favorableElements, locale);
  const unfavorableFormatted = formatFavorableElements(analysis.unfavorableElements, locale);
  const strengthFormatted = formatStrengthLabel(analysis.dayMasterStrength, locale);
  const liunianFormatted = formatLiunianPillars(analysis.liunianPillars, locale);

  const userPrompt = renderTemplate(template, locale, {
    birthDate: input.birthDate,
    birthTime: shichenFormatted,
    gender:
      input.gender === "male"
        ? locale === "zh-CN"
          ? "男"
          : "Male"
        : input.gender === "female"
          ? locale === "zh-CN"
            ? "女"
            : "Female"
          : locale === "zh-CN"
            ? "其他"
            : "Other",
    bazi: baziFormatted.join("  "),
    wuxing: wuxingFormatted,
    fateBook: fateBook,
    dayMaster: dayMasterFormatted,
    favorable: favorableFormatted,
    unfavorable: unfavorableFormatted,
    strength: strengthFormatted,
    liunian: liunianFormatted,
  });

  const aiResp = await generateAI({
    systemPrompt,
    userPrompt,
    maxTokens,
  });

  const showProducts = getSettingOrDefault("show_product_recommendations") !== "0";
  const recommendations = showProducts
    ? recommend({
        analysis,
        locale,
        limit: tier === "premium" ? 6 : 4,
        featuredFirst: true,
      })
    : [];

  const id = randomUUID();
  const now = Date.now();
  const row: ReportRow = {
    id,
    locale,
    birth_date: input.birthDate,
    birth_hour: input.hour,
    gender: input.gender,
    fate_book: fateBook,
    template,
    input_json: JSON.stringify({
      birthDate: input.birthDate,
      hour: input.hour,
      gender: input.gender,
      locale,
      template,
      fateBook,
      tier,
      creditCode: input.creditCode ?? null,
    }),
    analysis_json: JSON.stringify(analysis),
    content: aiResp.content,
    ai_provider: aiResp.provider,
    ai_model: aiResp.model,
    ai_latency_ms: aiResp.latencyMs ?? null,
    ip: input.ip ?? null,
    report_tier: tier,
    created_at: now,
    updated_at: now,
  };
  insertReport(row);

  if (input.creditCode) {
    markCreditUsed(input.creditCode, null, input.ip ?? null);
  }

  logEvent("report_created", {
    id,
    provider: aiResp.provider,
    model: aiResp.model,
    locale,
    tier,
    ip: input.ip,
    creditCode: input.creditCode ?? null,
  }, input.ip, locale);

  return {
    id,
    analysis,
    content: aiResp.content,
    ai: {
      provider: aiResp.provider,
      model: aiResp.model,
      latencyMs: aiResp.latencyMs,
      usage: aiResp.usage,
    },
    recommendations,
    template,
    fateBook,
    tier,
    createdAt: now,
    durationMs: Date.now() - t0,
  };
}

export function loadReport(id: string): {
  row: ReportRow;
  analysis: FateAnalysis;
  recommendations: ReturnType<typeof recommend>;
} | null {
  const row = getReport(id);
  if (!row) return null;
  const analysis: FateAnalysis = JSON.parse(row.analysis_json) as FateAnalysis;
  const showProducts = getSettingOrDefault("show_product_recommendations") !== "0";
  const recommendations = showProducts
    ? recommend({
      analysis,
      locale: row.locale as Locale,
      limit: row.report_tier === "premium" ? 6 : 4,
      featuredFirst: true,
    })
    : [];
  return { row, analysis, recommendations };
}
