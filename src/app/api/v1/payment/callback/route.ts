/**
 * GET /api/v1/payment/callback — payment success callback
 * Handles both Stripe and PayPal returns
 */
import { NextResponse, type NextRequest } from "next/server";
import { capturePayPalOrder } from "@/lib/payment";
import { insertOrder, type OrderRow } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");

  if (provider === "paypal") {
    const orderId = req.nextUrl.searchParams.get("token");
    if (!orderId) {
      return NextResponse.redirect(new URL("/analyze?payment=error", req.url));
    }
    const result = await capturePayPalOrder(orderId);
    if (!result.captured) {
      return NextResponse.redirect(new URL("/analyze?payment=failed", req.url));
    }

    const now = Date.now();
    const orderRow: OrderRow = {
      id: randomUUID(),
      report_id: result.reportId ?? null,
      product_id: "premium-report",
      product_type: "online",
      buyer_email: null,
      buyer_ip: null,
      amount: "premium",
      status: "paid",
      tracking_no: null,
      delivery_note: `PayPal Order: ${orderId}`,
      paid_at: now,
      delivered_at: null,
      created_at: now,
      updated_at: now,
    };
    insertOrder(orderRow);

    return NextResponse.redirect(
      new URL(`/analyze?payment=success&order=${orderRow.id}`, req.url)
    );
  }

  if (provider === "stripe") {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.redirect(new URL("/analyze?payment=error", req.url));
    }
    return NextResponse.redirect(
      new URL(`/analyze?payment=success&session=${sessionId}`, req.url)
    );
  }

  return NextResponse.redirect(new URL("/analyze?payment=error", req.url));
}
