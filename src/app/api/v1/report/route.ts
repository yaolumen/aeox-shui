/**
 * POST /api/v1/report — generate a new report
 * GET  /api/v1/report — list (admin) - not used in lite
 */
import { NextResponse, type NextRequest } from "next/server";
import { generateReport, validateCreditCode } from "@/lib/report-service";
import { checkAndRecord, getClientIp } from "@/lib/rate-limit";
import { logEvent, purgeExpiredReports, getReportCycle } from "@/lib/db";
import { getSettingOrDefault } from "@/lib/settings";
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "@/lib/config";
import { pickLocale } from "@/lib/i18n";
import { createPaymentSession } from "@/lib/payment";
import { ReportBodySchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseLocale(s: string | undefined, acceptLang: string | null): Locale {
  if (s && (SUPPORTED_LOCALES as readonly string[]).includes(s)) {
    return s as Locale;
  }
  return pickLocale(acceptLang, DEFAULT_LOCALE);
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try { purgeExpiredReports(); } catch (e) { console.error("[purgeExpiredReports]", e); }

  const rl = checkAndRecord(ip, "report:create");
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests", resetAt: rl.resetAt },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))) } }
    );
  }

  let body;
  try {
    body = parseJsonBody(await req.json(), ReportBodySchema);
  } catch (e) {
    return handleParseError(e);
  }

  if (!body.birthDate || !isValidDate(body.birthDate)) {
    return NextResponse.json({ error: "invalid_birthDate", message: "birthDate must be YYYY-MM-DD between 1900-01-01 and today" }, { status: 400 });
  }
  const hour = typeof body.hour === "number" ? body.hour : NaN;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return NextResponse.json({ error: "invalid_hour" }, { status: 400 });
  }
  if (!body.gender || !["male", "female", "other"].includes(body.gender)) {
    return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  }

  const acceptLang = req.headers.get("accept-language");
  const locale = parseLocale(body.locale, acceptLang);
  const template = body.template ?? "foundation";
  const fateBook = body.fateBook ?? "sanming";
  const mode = getSettingOrDefault("monetization_mode");
  const tier = mode === "ecommerce" ? "free" : (body.tier ?? "free");

  let cycleYears = 1;
  if (body.cycleId) {
    const cycle = getReportCycle(body.cycleId);
    if (cycle && cycle.enabled === 1) {
      cycleYears = cycle.years;
    }
  }

  if (tier === "premium") {
    if (body.creditCode) {
      const validation = validateCreditCode(body.creditCode);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "credit_invalid", message: validation.error },
          { status: 400 }
        );
      }
    } else {
      if (mode === "freemium") {
        const paymentProvider = getSettingOrDefault("payment_provider");
        if (paymentProvider === "none") {
          return NextResponse.json(
            { error: "premium_not_available", message: "Premium requires payment or credit code" },
            { status: 402 }
          );
        }
        const currency = locale === "zh-CN" ? "CNY" : "USD";
        const amount = locale === "zh-CN"
          ? parseFloat(getSettingOrDefault("premium_price_cny"))
          : parseFloat(getSettingOrDefault("premium_price_usd"));
        const host = req.headers.get("host") || "localhost:3000";
        const proto = req.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
        const baseUrl = `${proto}://${host}`;
        try {
          const session = await createPaymentSession({
            reportId: `pending_${Date.now()}`,
            amount,
            currency,
            successUrl: `${baseUrl}/api/v1/payment/callback`,
            cancelUrl: `${baseUrl}/analyze`,
          });
          return NextResponse.json({
            requires_payment: true,
            payment_url: session.url,
            payment_id: session.id,
            provider: session.provider,
          });
        } catch (err) {
          return NextResponse.json(
            { error: "payment_failed", message: (err as Error).message },
            { status: 500 }
          );
        }
      }
    }
  }

  logEvent("report_request", { birthDate: body.birthDate, hour, gender: body.gender, locale, template, fateBook, tier }, ip, locale);

  try {
    const result = await generateReport({
      birthDate: body.birthDate,
      hour,
      gender: body.gender,
      locale,
      template,
      fateBook,
      ip,
      tier,
      creditCode: body.creditCode,
      cycleYears,
    });
    return NextResponse.json({
      id: result.id,
      content: result.content,
      analysis: result.analysis,
      recommendations: result.recommendations,
      ai: result.ai,
      template: result.template,
      fateBook: result.fateBook,
      tier: result.tier,
      createdAt: result.createdAt,
      durationMs: result.durationMs,
    });
  } catch (err) {
    logEvent("report_error", { message: (err as Error).message }, ip, locale);
    return NextResponse.json(
      { error: "internal", message: (err as Error).message },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
