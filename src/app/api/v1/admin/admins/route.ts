/**
 * Admin: Admins CRUD
 * GET    /api/v1/admin/admins   — list all admins
 * POST   /api/v1/admin/admins   — create admin (super only)
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, requireSuperAdmin } from "@/lib/auth-helpers";
import { listAdmins, upsertAdmin, hashPassword, type AdminRow } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const rows = listAdmins();
  return NextResponse.json({
    admins: rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      enabled: r.enabled === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  let body: { name?: string; password?: string; role?: string; enabled?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.name || !body.password || body.password.length < 6) {
    return NextResponse.json(
      { error: "missing_fields", required: ["name", "password (min 6 chars)"] },
      { status: 400 }
    );
  }
  const now = Date.now();
  const row: AdminRow = {
    id: randomUUID(),
    name: body.name,
    role: body.role === "super" ? "super" : "sub",
    password_hash: hashPassword(body.password),
    enabled: body.enabled !== false ? 1 : 0,
    created_at: now,
    updated_at: now,
  };
  upsertAdmin(row);
  return NextResponse.json({ ok: true, id: row.id, name: row.name, role: row.role });
}
