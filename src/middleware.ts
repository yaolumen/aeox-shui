import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, VALID_LOCALES } from "@/lib/i18n";

const ADMIN_SLUG = process.env.ADMIN_SLUG || "admingl";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_SLUG !== "admin") {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return new NextResponse(null, { status: 404 });
    }
  }

  const lang = req.nextUrl.searchParams.get("lang");
  const res = NextResponse.next();

  if (lang && VALID_LOCALES.includes(lang as "en" | "zh-CN")) {
    res.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|ai.txt|llms.txt).*)"],
};
