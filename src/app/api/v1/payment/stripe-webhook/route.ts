/**
 * POST /api/v1/payment/stripe-webhook — Stripe webhook handler
 */
import { NextResponse, type NextRequest } from "next/server";
import { verifyStripeWebhook } from "@/lib/payment";
import { insertOrder, type OrderRow } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sigHeader = req.headers.get("stripe-signature") ?? "";

  const result = await verifyStripeWebhook(payload, sigHeader);
  if (!result) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (result.event === "checkout.session.completed") {
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
      delivery_note: `Stripe Session: ${result.sessionId ?? ""}`,
      paid_at: now,
      delivered_at: null,
      created_at: now,
      updated_at: now,
    };
    insertOrder(orderRow);
  }

  return NextResponse.json({ received: true });
}
