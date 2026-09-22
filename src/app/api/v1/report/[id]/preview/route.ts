import { NextRequest, NextResponse } from "next/server";
import { loadReport } from "@/lib/report-service";
import { buildHtml } from "@/lib/pdf/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = loadReport(id);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { row, analysis, recommendations } = data;
  const url = new URL(req.url);
  const theme = url.searchParams.get("theme") || undefined;
  const icon = url.searchParams.get("icon") || undefined;
  const columnsParam = url.searchParams.get("columns");
  const columns = columnsParam === "1" ? 1 : 2;

  const html = buildHtml({
    id: row.id,
    locale: row.locale as "en" | "zh-CN",
    content: row.content,
    analysis,
    ai: { provider: row.ai_provider, model: row.ai_model },
    fateBook: row.fate_book,
    tier: row.report_tier || "free",
    createdAt: row.created_at,
    recommendations,
    theme,
    icon,
    columns,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
