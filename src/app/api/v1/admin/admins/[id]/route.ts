/**
 * Admin: single admin update / delete
 * PATCH  /api/v1/admin/admins/[id] — update admin (super only)
 * DELETE /api/v1/admin/admins/[id] — delete admin (super only, cannot delete self)
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { getAdmin, upsertAdmin, deleteAdmin, hashPassword, type AdminRow } from "@/lib/db";
import { AdminPatchSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  const existing = getAdmin(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  let body;
  try {
    body = parseJsonBody(await req.json(), AdminPatchSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const updated: AdminRow = {
    ...existing,
    name: body.name ?? existing.name,
    role: body.role ?? existing.role,
    enabled: body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled,
    updated_at: Date.now(),
  };
  if (body.password) {
    updated.password_hash = hashPassword(body.password);
  }
  upsertAdmin(updated);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  if (authResult.adminId === id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }
  const existing = getAdmin(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  deleteAdmin(id);
  return NextResponse.json({ ok: true, id });
}
