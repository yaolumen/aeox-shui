/**
 * Admin: single AI provider update / delete
 * PATCH  /api/v1/admin/ai-providers/[id]
 * DELETE /api/v1/admin/ai-providers/[id]
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { deleteAIProvider, getAIProvider, upsertAIProvider, type AIProviderRow } from "@/lib/db";
import { AIProviderPatchSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";
import { invalidateProviderCache } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  const existing = getAIProvider(id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let body;
  try {
    body = parseJsonBody(await req.json(), AIProviderPatchSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const next: AIProviderRow = {
    ...existing,
    name: typeof body.name === "string" ? body.name : existing.name,
    base_url: typeof body.baseUrl === "string" ? body.baseUrl : existing.base_url,
    model: typeof body.model === "string" ? body.model : existing.model,
    api_key: typeof body.apiKey === "string" && body.apiKey.length >= 6
      ? body.apiKey
      : existing.api_key,
    role: typeof body.role === "string" ? body.role : existing.role,
    enabled: body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled,
    sort_order: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sort_order,
    note: typeof body.note === "string" ? body.note : existing.note,
    updated_at: Date.now(),
  };
  if (body.apiKey === "" || body.apiKey === null) {
    return NextResponse.json({ error: "api_key_required" }, { status: 400 });
  }
  upsertAIProvider(next);
  invalidateProviderCache();
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  deleteAIProvider(id);
  invalidateProviderCache();
  return NextResponse.json({ ok: true, id });
}
