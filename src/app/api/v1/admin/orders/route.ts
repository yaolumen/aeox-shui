/**
 * Admin: Orders CRUD
 * GET  /api/v1/admin/orders       — list all (with optional status filter)
 * POST /api/v1/admin/orders       — create manual order
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { listOrders, countOrders, insertOrder, type OrderRow } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { OrderCreateSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const orders = listOrders(status);
  const total = countOrders();
  const pending = countOrders("pending");
  const paid = countOrders("paid");
  const delivered = countOrders("delivered");
  return NextResponse.json({
    orders: orders.map(formatOrder),
    counts: { total, pending, paid, delivered },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  let body;
  try {
    body = parseJsonBody(await req.json(), OrderCreateSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const now = Date.now();
  const row: OrderRow = {
    id: body.id || randomUUID(),
    report_id: body.reportId ?? null,
    product_id: body.productId,
    product_type: body.productType,
    buyer_email: body.buyerEmail ?? null,
    buyer_ip: body.buyerIp ?? null,
    amount: body.amount ?? null,
    status: body.status ?? "pending",
    tracking_no: body.trackingNo ?? null,
    delivery_note: body.deliveryNote ?? null,
    paid_at: body.paidAt ?? null,
    delivered_at: body.deliveredAt ?? null,
    created_at: now,
    updated_at: now,
  };
  insertOrder(row);
  return NextResponse.json({ ok: true, id: row.id });
}

function formatOrder(r: OrderRow) {
  return {
    id: r.id,
    reportId: r.report_id,
    productId: r.product_id,
    productType: r.product_type,
    buyerEmail: r.buyer_email,
    buyerIp: r.buyer_ip,
    amount: r.amount,
    status: r.status,
    trackingNo: r.tracking_no,
    deliveryNote: r.delivery_note,
    paidAt: r.paid_at,
    deliveredAt: r.delivered_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
