/**
 * Payment integration — Stripe & PayPal Checkout
 * Quantum Fate Lite
 */
import { getSettingOrDefault } from "@/lib/settings";
import { fetchWithTimeout } from "@/lib/utils";
import {
  StripeSessionSchema,
  PayPalTokenSchema,
  PayPalOrderSchema,
  StripeWebhookSchema,
  PayPalCaptureSchema,
} from "@/types/api";

export interface PaymentSession {
  id: string;
  url: string;
  provider: "stripe" | "paypal";
}

export interface PaymentVerifyResult {
  ok: boolean;
  provider: "stripe" | "paypal";
  orderId?: string;
  error?: string;
}

export async function createPaymentSession(params: {
  reportId: string;
  amount: number;
  currency: string;
  buyerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<PaymentSession> {
  const provider = getSettingOrDefault("payment_provider");

  if (provider === "stripe") {
    return createStripeSession(params);
  }
  if (provider === "paypal") {
    return createPayPalOrder(params);
  }

  throw new Error("No payment provider configured");
}

async function createStripeSession(params: {
  reportId: string;
  amount: number;
  currency: string;
  buyerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<PaymentSession> {
  const secretKey = getSettingOrDefault("stripe_secret_key");
  if (!secretKey) throw new Error("Stripe secret key not configured");

  const body = new URLSearchParams({
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": params.currency,
    "line_items[0][price_data][product_data][name]": "Personalized Energy Profile — In-Depth Edition",
    "line_items[0][price_data][product_data][description]": "Digital Educational Content — personalized energy cycle analysis report by Shui",
    "line_items[0][price_data][unit_amount]": String(Math.round(params.amount * 100)),
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
    "metadata[report_id]": params.reportId,
  });

  if (params.buyerEmail) {
    body.set("customer_email", params.buyerEmail);
  }

  const resp = await fetchWithTimeout("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  }, 30000);

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Stripe session creation failed: ${err.slice(0, 300)}`);
  }

  const data = StripeSessionSchema.parse(await resp.json());
  return {
    id: data.id,
    url: data.url,
    provider: "stripe",
  };
}

const paypalTokenCache: { token: string | null; ts: number } = { token: null, ts: 0 };
const PAYPAL_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

async function getPayPalAccessToken(baseUrl: string, clientId: string, secret: string): Promise<string> {
  const now = Date.now();
  if (paypalTokenCache.token && now - paypalTokenCache.ts < PAYPAL_TOKEN_TTL_MS) {
    return paypalTokenCache.token;
  }
  const tokenResp = await fetchWithTimeout(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  }, 30000);

  if (!tokenResp.ok) {
    throw new Error("PayPal auth failed");
  }

  const tokenData = PayPalTokenSchema.parse(await tokenResp.json());
  paypalTokenCache.token = tokenData.access_token;
  const expiresInSec = tokenData.expires_in ?? 28800;
  paypalTokenCache.ts = now + (28800 - expiresInSec) * 1000;
  return tokenData.access_token;
}

async function createPayPalOrder(params: {
  reportId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<PaymentSession> {
  const clientId = getSettingOrDefault("paypal_client_id");
  const secret = getSettingOrDefault("paypal_secret");
  const sandbox = getSettingOrDefault("paypal_sandbox") === "1";

  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const baseUrl = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const accessToken = await getPayPalAccessToken(baseUrl, clientId, secret);

  const orderResp = await fetchWithTimeout(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reportId,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: String(params.amount),
          },
          description: "Personalized Energy Profile — In-Depth Edition",
        },
      ],
      application_context: {
        return_url: params.successUrl,
        cancel_url: params.cancelUrl,
        brand_name: "Shui",
      },
    }),
  }, 30000);

  if (!orderResp.ok) {
    const err = await orderResp.text();
    throw new Error(`PayPal order creation failed: ${err.slice(0, 300)}`);
  }

  const orderData = PayPalOrderSchema.parse(await orderResp.json());
  const approveLink = orderData.links.find((l) => l.rel === "approve");
  if (!approveLink) throw new Error("PayPal approve link not found");

  return {
    id: orderData.id,
    url: approveLink.href,
    provider: "paypal",
  };
}

export async function verifyStripeWebhook(
  payload: string,
  sigHeader: string
): Promise<{ event: string; reportId?: string; sessionId?: string } | null> {
  const webhookSecret = getSettingOrDefault("stripe_webhook_secret");
  if (!webhookSecret) return null;

  try {
    const crypto = await import("node:crypto");
    const parts = sigHeader.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
    const signature = parts.find((p) => p.startsWith("v1="))?.slice(3);
    if (!timestamp || !signature) return null;

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    if (signature !== expectedSig) return null;

    const data = StripeWebhookSchema.parse(JSON.parse(payload));

    return {
      event: data.type,
      reportId: data.data.object.metadata?.report_id,
      sessionId: data.data.object.id,
    };
  } catch {
    return null;
  }
}

export async function capturePayPalOrder(
  orderId: string
): Promise<{ captured: boolean; reportId?: string }> {
  const clientId = getSettingOrDefault("paypal_client_id");
  const secret = getSettingOrDefault("paypal_secret");
  const sandbox = getSettingOrDefault("paypal_sandbox") === "1";

  if (!clientId || !secret) return { captured: false };

  const baseUrl = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  let accessToken: string;
  try {
    accessToken = await getPayPalAccessToken(baseUrl, clientId, secret);
  } catch {
    return { captured: false };
  }

  const captureResp = await fetchWithTimeout(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    30000
  );

  if (!captureResp.ok) return { captured: false };

  const captureData = PayPalCaptureSchema.parse(await captureResp.json());

  return {
    captured: captureData.status === "COMPLETED",
    reportId: captureData.purchase_units?.[0]?.reference_id,
  };
}
