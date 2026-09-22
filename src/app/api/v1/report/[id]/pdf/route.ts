import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const theme = url.searchParams.get("theme") || "";
  const icon = url.searchParams.get("icon") || "";
  const qs = theme || icon
    ? `?${[theme && `theme=${theme}`, icon && `icon=${icon}`].filter(Boolean).join("&")}`
    : "";
  return NextResponse.redirect(
    new URL(`/api/v1/report/${id}/preview${qs}`, req.url),
  );
}
