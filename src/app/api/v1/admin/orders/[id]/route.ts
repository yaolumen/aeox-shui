/**
 * Admin: single order update
 * PATCH /api/v1/admin/orders/[id] — update order (e.g. add tracking, change status)
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getOrder, updateOrder, type OrderRow } from "@/lib/db";
import { OrderPatchSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  const existing = getOrder(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body;
  try {
    body = parseJsonBody(await req.json(), OrderPatchSchema);
  } catch (e) {
    return handleParseError(e);
  }

  const updated: OrderRow = {
    ...existing,
    status: body.status ?? existing.status,
    tracking_no: body.trackingNo ?? existing.tracking_no,
    delivery_note: body.deliveryNote ?? existing.delivery_note,
    buyer_email: body.buyerEmail ?? existing.buyer_email,
    updated_at: Date.now(),
  };

  if (body.status === "delivered" && !existing.delivered_at) {
    updated.delivered_at = Date.now();
  }
  if (body.status === "paid" && !existing.paid_at) {
    updated.paid_at = Date.now();
  }

  updateOrder(updated);
  return NextResponse.json({ ok: true, id });
}
