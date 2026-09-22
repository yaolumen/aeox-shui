/**
 * GET /api/v1/report/[id] — fetch a saved report
 */
import { NextResponse, type NextRequest } from "next/server";
import { loadReport } from "@/lib/report-service";
import { checkAndRecord, getClientIp } from "@/lib/rate-limit";
import { logEvent } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = checkAndRecord(ip, "report:get");
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id } = await ctx.params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const data = loadReport(id);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  logEvent("report_view", { id }, ip, data.row.locale);

  return NextResponse.json({
    id: data.row.id,
    locale: data.row.locale,
    content: data.row.content,
    analysis: data.analysis,
    recommendations: data.recommendations,
    ai: {
      provider: data.row.ai_provider,
      model: data.row.ai_model,
      latencyMs: data.row.ai_latency_ms,
    },
    template: data.row.template,
    fateBook: data.row.fate_book,
    tier: data.row.report_tier || "free",
    createdAt: data.row.created_at,
  });
}
