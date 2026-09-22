/**
 * GET /api/v1/ai/health — return which AI providers are configured.
 * Public. Never leaks the actual key, only metadata.
 */
import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { countAIProviders } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dbCount = countAIProviders();
  const all = ai.listAllKnownProviders();
  const configured = all.filter((p) => p.configured);
  return NextResponse.json({
    configured: configured.length > 0,
    providerCount: dbCount,
    note:
      dbCount === 0
        ? "No AI provider configured. Add one in the admin panel."
        : `${dbCount} provider(s) configured.`,
    serverTime: Date.now(),
  });
}
