import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { deleteReportCycle, getReportCycle } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await params;
  const existing = getReportCycle(id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  deleteReportCycle(id);
  return NextResponse.json({ ok: true });
}
