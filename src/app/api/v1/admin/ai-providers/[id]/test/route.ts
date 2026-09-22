/**
 * Admin: test a single AI provider with a minimal ping
 * POST /api/v1/admin/ai-providers/[id]/test
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { testDBProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  const result = await testDBProvider(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
