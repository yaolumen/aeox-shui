/**
 * Admin: Settings CRUD
 * GET  /api/v1/admin/settings   — list all
 * POST /api/v1/admin/settings   — batch update
 * Super admin only
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAllSettingsWithDefaults, setSettingValue, type AppSettings, DEFAULTS } from "@/lib/settings";
import { invalidateProviderCache } from "@/lib/ai";
import { SettingsUpdateSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";
import { requireAuth, requireSuperAdmin } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const settings = getAllSettingsWithDefaults();
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(settings)) {
    if ((k === "stripe_secret_key" || k === "paypal_secret") && v) {
      masked[k] = v.slice(0, 4) + "••••" + v.slice(-4);
    } else {
      masked[k] = v;
    }
  }
  return NextResponse.json({ settings: masked });
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) return authResult;
  let body;
  try {
    body = parseJsonBody(await req.json(), SettingsUpdateSchema);
  } catch (e) {
    return handleParseError(e);
  }
  const SECRET_KEYS = new Set(["stripe_secret_key", "paypal_secret", "stripe_webhook_secret", "paypal_client_id"]);
  for (const [k, v] of Object.entries(body)) {
    if (!v) continue;
    if (SECRET_KEYS.has(k) && v.includes("••••")) continue;
    if (k in DEFAULTS) {
      setSettingValue(k as keyof AppSettings, v);
    }
  }
  invalidateProviderCache();
  return NextResponse.json({ ok: true });
}
