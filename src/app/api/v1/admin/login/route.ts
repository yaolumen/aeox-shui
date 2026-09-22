import { NextResponse, type NextRequest } from "next/server";
import { checkAdminLogin, checkPassword, makeToken, ADMIN_COOKIE_NAME, type LoginResult } from "@/lib/admin-auth";
import { logEvent, adminHeartbeat, countOnlineAdmins, removeAdminSession } from "@/lib/db";
import { LoginBodySchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CONCURRENT_ADMINS = 2;
const RATE_LIMIT_MAX_FAILURES = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const loginFailures = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginFailures.get(ip);
  if (!entry || now > entry.resetAt) {
    loginFailures.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX_FAILURES;
}

function clearRateLimit(ip: string): void {
  loginFailures.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too_many_attempts", message: "Too many login failures. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = parseJsonBody(await req.json(), LoginBodySchema);
  } catch (e) {
    return handleParseError(e);
  }

  let result: LoginResult;
  let tokenResult: { token: string; maxAgeSeconds: number } | null = null;

  if (body.name) {
    result = checkAdminLogin(body.name, body.password ?? "");
  } else if (checkPassword(body.password)) {
    tokenResult = makeToken("super-admin", "super");
    result = {
      ok: true,
      token: tokenResult.token,
      role: "super",
      adminId: "super-admin",
    };
  } else {
    result = { ok: false, error: "invalid_password" };
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "invalid_credentials" }, { status: 401 });
  }

  clearRateLimit(ip);

  if (!tokenResult) {
    tokenResult = makeToken(result.adminId!, result.role!);
    result.token = tokenResult.token;
  }

  adminHeartbeat(result.adminId!, result.role!, ip);

  const onlineCount = countOnlineAdmins();

  if (onlineCount > MAX_CONCURRENT_ADMINS) {
    removeAdminSession(result.adminId!);
    return NextResponse.json({
      error: "max_admins_reached",
      message: `Maximum ${MAX_CONCURRENT_ADMINS} concurrent admins. Currently ${onlineCount - 1} online.`,
    }, { status: 429 });
  }

  logEvent("admin_login", { adminId: result.adminId, role: result.role, ip });

  const res = NextResponse.json({
    ok: true,
    role: result.role,
    adminId: result.adminId,
  });
  res.cookies.set(ADMIN_COOKIE_NAME, tokenResult.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokenResult.maxAgeSeconds,
  });
  return res;
}
