/**
 * GET /api/v1/admin/stats — traffic stats
 * Auth: signed cookie required
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminHeartbeat } from "@/lib/db";
import { countEvents, countProducts, getDb, getOnlineAdmins, countRecentActiveUsers } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  adminHeartbeat(authResult.adminId, authResult.role, ip);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const reportsToday = countEvents("report_request", oneDayAgo);
  const reportsWeek = countEvents("report_request", sevenDaysAgo);
  const reportsAll = countEvents("report_request", 0);
  const viewsToday = countEvents("report_view", oneDayAgo);
  const errorsToday = countEvents("report_error", oneDayAgo);

  // Total reports in DB
  const totalReportsRow = getDb()
    .prepare<[], { c: number }>("SELECT COUNT(*) AS c FROM reports")
    .get();
  const totalReports = totalReportsRow?.c ?? 0;

  const totalProducts = countProducts();

  // Last 7 days daily counts
  const daily: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const c = countEvents("report_request", dayStart) - countEvents("report_request", dayEnd);
    daily.push({
      date: d.toISOString().slice(5, 10),
      count: Math.max(0, c),
    });
  }

  // Recent reports
  const recent = getDb()
    .prepare<[], { id: string; created_at: number; locale: string; ai_provider: string | null }>(
      "SELECT id, created_at, locale, ai_provider FROM reports ORDER BY created_at DESC LIMIT 10"
    )
    .all();

  return NextResponse.json({
    reports: {
      total: totalReports,
      allTime: reportsAll,
      last7Days: reportsWeek,
      last24h: reportsToday,
      views24h: viewsToday,
      errors24h: errorsToday,
    },
    products: { total: totalProducts },
    daily,
    recent: recent.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      locale: r.locale,
      provider: r.ai_provider,
    })),
    serverTime: now,
    online: {
      admins: getOnlineAdmins(),
      recentUsers: countRecentActiveUsers(5),
    },
  });
}
