import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseToken, isSuperAdmin, ADMIN_COOKIE_NAME, type TokenInfo } from "@/lib/admin-auth";

export async function requireAuth(): Promise<TokenInfo | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const info = parseToken(token);
  if (!info) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return info;
}

export async function requireSuperAdmin(): Promise<TokenInfo | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!isSuperAdmin(token)) {
    return NextResponse.json({ error: "forbidden", message: "Super admin only" }, { status: 403 });
  }
  return parseToken(token)!;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function forbidden(message: string = "Super admin only"): NextResponse {
  return NextResponse.json({ error: "forbidden", message }, { status: 403 });
}
