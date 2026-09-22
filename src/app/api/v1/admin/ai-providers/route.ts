/**
 * Admin: AI provider CRUD
 * GET    /api/v1/admin/ai-providers   — list all (incl. disabled)
 * POST   /api/v1/admin/ai-providers   — create
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  listAIProviders,
  upsertAIProvider,
  type AIProviderRow,
} from "@/lib/db";
import { AIProviderCreateSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";
import { invalidateProviderCache } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskKey(k: string): string {
  if (!k) return "";
  if (k.length <= 8) return "••••";
  return k.slice(0, 4) + "••••" + k.slice(-4);
}

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const rows = listAIProviders();
  return NextResponse.json({
    providers: rows.map((r) => ({
      id: r.id,
      name: r.name,
      baseUrl: r.base_url,
      model: r.model,
      apiKeyMasked: maskKey(r.api_key),
      apiKeyLength: r.api_key.length,
      role: r.role || "primary",
      enabled: r.enabled === 1,
      sortOrder: r.sort_order,
      note: r.note,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  let body;
  try {
    body = parseJsonBody(await req.json(), AIProviderCreateSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const now = Date.now();
  const existing = listAIProviders().find((r) => r.id === body.id);
  const row: AIProviderRow = {
    id: body.id,
    name: body.name,
    base_url: body.baseUrl,
    model: body.model,
    api_key: body.apiKey,
    role: body.role ?? existing?.role ?? "primary",
    enabled: body.enabled === false ? 0 : 1,
    sort_order: body.sortOrder ?? (existing?.sort_order ?? listAIProviders().length),
    note: body.note ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  upsertAIProvider(row);
  invalidateProviderCache();
  return NextResponse.json({ ok: true, id: row.id });
}
