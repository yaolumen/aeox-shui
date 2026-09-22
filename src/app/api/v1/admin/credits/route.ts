/**
 * Admin: Credits (卡密) management
 * GET  /api/v1/admin/credits   — list credits
 * POST /api/v1/admin/credits   — generate new credits
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, requireSuperAdmin } from "@/lib/auth-helpers";
import { listCredits, countCredits, insertCredit, generateCreditCode, type CreditRow } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const usedParam = req.nextUrl.searchParams.get("used");
  const used = usedParam !== null ? parseInt(usedParam, 10) : undefined;
  const credits = listCredits(used);
  const total = countCredits();
  const unused = countCredits(0);
  const usedCount = countCredits(1);
  return NextResponse.json({
    credits: credits.map(formatCredit),
    counts: { total, unused, used: usedCount },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  let body: { count?: number; tier?: string; expiresInDays?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const count = Math.min(Math.max(body.count ?? 1, 1), 100);
  const tier = "premium";
  const expiresInDays = body.expiresInDays ?? 365;
  const now = Date.now();
  const expiresAt = expiresInDays > 0 ? now + expiresInDays * 24 * 60 * 60 * 1000 : null;
  const generated: Array<{ id: string; code: string; tier: string; expiresAt: number | null }> = [];

  for (let i = 0; i < count; i++) {
    const code = generateCreditCode();
    const id = randomUUID();
    const row: CreditRow = {
      id,
      code,
      tier,
      credits: 1,
      used: 0,
      buyer_email: null,
      ip: null,
      created_at: now,
      used_at: null,
      expires_at: expiresAt,
    };
    insertCredit(row);
    generated.push({ id, code, tier, expiresAt });
  }
  return NextResponse.json({ ok: true, generated, count: generated.length });
}

function formatCredit(r: CreditRow) {
  return {
    id: r.id,
    code: r.code,
    tier: r.tier,
    credits: r.credits,
    used: r.used === 1,
    buyerEmail: r.buyer_email,
    ip: r.ip,
    createdAt: r.created_at,
    usedAt: r.used_at,
    expiresAt: r.expires_at,
  };
}
