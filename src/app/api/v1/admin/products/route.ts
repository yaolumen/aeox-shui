/**
 * Admin: products CRUD
 * GET  /api/v1/admin/products   — list all (incl. inactive)
 * POST /api/v1/admin/products   — create
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getDb,
  upsertProduct,
  type ProductRow,
} from "@/lib/db";
import { ensureSeedProducts } from "@/lib/products/recommendation";
import { ProductCreateSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  ensureSeedProducts();
  const rows = getDb()
    .prepare<[], ProductRow>("SELECT * FROM products ORDER BY sort_order ASC, created_at DESC")
    .all();
  return NextResponse.json({
    products: rows.map((r) => ({
      id: r.id,
      titleEn: r.title_en,
      titleZh: r.title_zh,
      descriptionEn: r.description_en,
      descriptionZh: r.description_zh,
      category: r.category,
      productType: r.product_type || "online",
      url: r.url,
      price: r.price,
      deliveryInfo: r.delivery_info ? safeJson<Record<string, string>>(r.delivery_info, {}) : null,
      tags: safeJson<string[]>(r.tags, []),
      wuxing: safeJson<string[]>(r.wuxing, []),
      locales: safeJson<string[]>(r.locales, []),
      featured: r.featured === 1,
      active: r.active === 1,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  let body;
  try {
    body = parseJsonBody(await req.json(), ProductCreateSchema);
  } catch (e) {
    return handleParseError(e);
  }
  if (!body.url || (!body.titleEn && !body.titleZh)) {
    return NextResponse.json(
      { error: "missing_fields", required: ["url", "titleEn or titleZh"] },
      { status: 400 }
    );
  }
  if (!body.id) {
    return NextResponse.json(
      { error: "missing_fields", required: ["id"] },
      { status: 400 }
    );
  }
  const now = Date.now();
  const row: ProductRow = {
    id: body.id,
    title_en: body.titleEn ?? "",
    title_zh: body.titleZh ?? "",
    description_en: body.descriptionEn ?? null,
    description_zh: body.descriptionZh ?? null,
    category: body.category,
    product_type: body.productType || "online",
    url: body.url,
    price: body.price ?? null,
    delivery_info: body.deliveryInfo ? JSON.stringify(body.deliveryInfo) : null,
    tags: JSON.stringify(body.tags ?? []),
    wuxing: JSON.stringify(body.wuxing ?? []),
    locales: JSON.stringify(body.locales ?? ["en", "zh-CN"]),
    featured: body.featured ? 1 : 0,
    active: body.active === false ? 0 : 1,
    sort_order: body.sortOrder ?? 0,
    created_at: now,
    updated_at: now,
  };
  upsertProduct(row);
  return NextResponse.json({ ok: true, id: row.id });
}

function safeJson<T>(s: string | null, fb: T): T {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
}
