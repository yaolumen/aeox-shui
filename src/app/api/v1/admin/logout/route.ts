import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, parseToken } from "@/lib/admin-auth";
import { logEvent, removeAdminSession } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const info = parseToken(token);
  if (info) {
    removeAdminSession(info.adminId);
    logEvent("admin_logout", { adminId: info.adminId, role: info.role });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
