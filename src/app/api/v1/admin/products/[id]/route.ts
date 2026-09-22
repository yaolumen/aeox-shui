/**
 * Admin: single product update / delete
 * PATCH  /api/v1/admin/products/[id]
 * DELETE /api/v1/admin/products/[id]
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { deleteProduct, getDb, upsertProduct, type ProductRow } from "@/lib/db";
import { GenericObjectSchema } from "@/types/api";
import { parseJsonBody, handleParseError } from "@/types/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  const existing = getDb()
    .prepare<[string], ProductRow>("SELECT * FROM products WHERE id = ?")
    .get(id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body;
  try {
    body = parseJsonBody(await req.json(), GenericObjectSchema);
  } catch (e) {
    return handleParseError(e);
  }

  const updated: ProductRow = {
    ...existing,
    title_en: (body.titleEn as string) ?? existing.title_en,
    title_zh: (body.titleZh as string) ?? existing.title_zh,
    description_en: (body.descriptionEn as string | null) ?? existing.description_en,
    description_zh: (body.descriptionZh as string | null) ?? existing.description_zh,
    category: (body.category as string) ?? existing.category,
    product_type: (body.productType as string) ?? existing.product_type,
    url: (body.url as string) ?? existing.url,
    price: (body.price as string | null) ?? existing.price,
    delivery_info: body.deliveryInfo ? JSON.stringify(body.deliveryInfo) : existing.delivery_info,
    tags: body.tags ? JSON.stringify(body.tags) : existing.tags,
    wuxing: body.wuxing ? JSON.stringify(body.wuxing) : existing.wuxing,
    locales: body.locales ? JSON.stringify(body.locales) : existing.locales,
    featured: body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
    active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
    sort_order: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sort_order,
    updated_at: Date.now(),
  };
  upsertProduct(updated);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { id } = await ctx.params;
  deleteProduct(id);
  return NextResponse.json({ ok: true, id });
}
