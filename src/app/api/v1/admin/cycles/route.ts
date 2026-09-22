import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { listReportCycles, upsertReportCycle, type ReportCycleRow } from "@/lib/db";
import { CycleCreateSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const rows = listReportCycles();
  return NextResponse.json({
    cycles: rows.map((r) => ({
      id: r.id,
      name_en: r.name_en,
      name_zh: r.name_zh,
      years: r.years,
      enabled: r.enabled,
      sort_order: r.sort_order,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  let body;
  try {
    body = parseJsonBody(await req.json(), CycleCreateSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const now = Date.now();
  const existing = listReportCycles().find((r) => r.id === body.id);
  const row: ReportCycleRow = {
    id: body.id,
    name_en: body.name_en,
    name_zh: body.name_zh,
    years: body.years,
    enabled: body.enabled === false ? 0 : 1,
    sort_order: body.sort_order ?? (existing?.sort_order ?? listReportCycles().length),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  upsertReportCycle(row);
  return NextResponse.json({ ok: true, id: row.id });
}
