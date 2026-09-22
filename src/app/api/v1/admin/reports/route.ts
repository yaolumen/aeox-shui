import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const r = getDb().prepare("DELETE FROM reports").run();
  return NextResponse.json({ purged: r.changes });
}
