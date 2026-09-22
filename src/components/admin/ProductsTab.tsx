"use client";
import { useState } from "react";
import { useAdmin, Modal, Card, Field, Input, Select, Textarea, PrimaryBtn, GhostBtn, DangerBtn, Badge, SectionTitle, EmptyState } from "./ui";
import type { Product, Locale } from "./types";

function displayTitle(p: Product, locale: Locale): string {
  if (locale === "zh-CN") return p.titleZh || p.titleEn || p.id;
  return p.titleEn || p.titleZh || p.id;
}

function productTypeLabel(type: string, t: (typeof import("./types").T)[keyof typeof import("./types").T]): string {
  return type === "physical" ? t.typePhysical : t.typeAffiliate;
}

function productTypeColor(type: string): "blue" | "green" {
  return type === "physical" ? "green" : "blue";
}

function isOnlineType(type: string): boolean {
  return type !== "physical";
}

export function ProductsTab({
  products,
  onSave,
  onDelete,
}: {
  products: Product[];
  onSave: (p: Partial<Product> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  const { t, toast, busy, locale } = useAdmin();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const emptyProduct: Partial<Product> = {
    id: "",
    titleEn: "",
    titleZh: "",
    descriptionEn: "",
    descriptionZh: "",
    category: "ebook",
    productType: "online",
    url: "",
    price: "",
    deliveryInfo: null,
    tags: [],
    wuxing: [],
    locales: ["en", "zh-CN"],
    featured: false,
    active: true,
    sortOrder: products.length,
  };

  async function handleSave(p: Partial<Product> & { id: string }) {
    await onSave(p);
    setEditing(null);
    toast(t.saved, "ok");
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await onDelete(id);
    toast(t.delete + " ✓", "ok");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>{t.tabProducts}</SectionTitle>
        <PrimaryBtn onClick={() => setEditing(emptyProduct)}>+ {t.add}</PrimaryBtn>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id && products.find((x) => x.id === editing.id) ? t.edit : t.add}
        wide
      >
        {editing && (
          <ProductForm
            initial={editing}
            t={t}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </Modal>

      {products.length === 0 ? (
        <EmptyState>{t.noProducts}</EmptyState>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {p.id}
                </code>
                <span className="font-semibold">{displayTitle(p, locale)}</span>
                {p.featured && <Badge color="amber">★</Badge>}
                {!p.active && <Badge color="zinc">{t.off}</Badge>}
                <Badge color="zinc">{p.category}</Badge>
                <Badge color={productTypeColor(p.productType)}>
                  {productTypeLabel(p.productType, t)}
                </Badge>
                {p.price && <span className="text-xs text-zinc-500">{p.price}</span>}
                <span className="ml-auto flex gap-2">
                  <GhostBtn onClick={() => setEditing(p)} className="!text-sm">
                    {t.edit}
                  </GhostBtn>
                  <DangerBtn onClick={() => handleDelete(p.id)} disabled={busy} className="!text-sm">
                    {t.delete}
                  </DangerBtn>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  initial,
  t,
  busy,
  onCancel,
  onSave,
}: {
  initial: Partial<Product>;
  t: (typeof import("./types").T)[keyof typeof import("./types").T];
  busy: boolean;
  onCancel: () => void;
  onSave: (p: Partial<Product> & { id: string }) => void;
}) {
  const isExisting = !!initial.id && !!initial.titleEn;
  const [p, setP] = useState<Partial<Product>>(initial);
  const productType = p.productType ?? "online";
  const showDelivery = isOnlineType(productType);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t.id}>
          <Input
            value={p.id ?? ""}
            onChange={(e) => setP({ ...p, id: e.target.value })}
            disabled={isExisting}
            placeholder="ebook-energy-101"
          />
        </Field>
        <Field label={t.category}>
          <Select
            value={p.category ?? "ebook"}
            onChange={(e) => setP({ ...p, category: e.target.value })}
          >
            <option value="ebook">ebook</option>
            <option value="course">course</option>
            <option value="tool">tool</option>
            <option value="merch">merch</option>
          </Select>
        </Field>
        <Field label={t.productType}>
          <Select
            value={productType}
            onChange={(e) =>
              setP({
                ...p,
                productType: e.target.value,
                deliveryInfo: e.target.value === "physical" ? null : p.deliveryInfo ?? null,
              })
            }
          >
            <option value="online">{t.typeAffiliate}</option>
            <option value="physical">{t.typePhysical}</option>
          </Select>
        </Field>
        <Field label={t.sortOrder}>
          <Input
            type="number"
            value={p.sortOrder ?? 0}
            onChange={(e) => setP({ ...p, sortOrder: parseInt(e.target.value || "0", 10) })}
          />
        </Field>
        <Field label={t.titleEn}>
          <Input value={p.titleEn ?? ""} onChange={(e) => setP({ ...p, titleEn: e.target.value })} placeholder="English title (fallback if Chinese empty)" />
        </Field>
        <Field label={t.titleZh}>
          <Input value={p.titleZh ?? ""} onChange={(e) => setP({ ...p, titleZh: e.target.value })} placeholder="中文标题（英文为空时回退）" />
        </Field>
        <Field label={t.descEn}>
          <Textarea
            value={p.descriptionEn ?? ""}
            onChange={(e) => setP({ ...p, descriptionEn: e.target.value })}
            rows={2}
          />
        </Field>
        <Field label={t.descZh}>
          <Textarea
            value={p.descriptionZh ?? ""}
            onChange={(e) => setP({ ...p, descriptionZh: e.target.value })}
            rows={2}
          />
        </Field>
        <Field label={t.url}>
          <Input
            value={p.url ?? ""}
            onChange={(e) => setP({ ...p, url: e.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label={t.price}>
          <Input
            value={p.price ?? ""}
            onChange={(e) => setP({ ...p, price: e.target.value })}
            placeholder="USD 9.99"
          />
        </Field>
        {showDelivery && (
          <>
            <Field label={t.deliveryUrl}>
              <Input
                value={(p.deliveryInfo as Record<string, string>)?.downloadUrl ?? ""}
                onChange={(e) =>
                  setP({
                    ...p,
                    deliveryInfo: {
                      ...((p.deliveryInfo as Record<string, string>) ?? {}),
                      downloadUrl: e.target.value,
                    },
                  })
                }
                placeholder="https://pan.baidu.com/s/..."
              />
            </Field>
            <Field label={t.deliveryPassword}>
              <Input
                value={(p.deliveryInfo as Record<string, string>)?.password ?? ""}
                onChange={(e) =>
                  setP({
                    ...p,
                    deliveryInfo: {
                      ...((p.deliveryInfo as Record<string, string>) ?? {}),
                      password: e.target.value,
                    },
                  })
                }
                placeholder="abc123"
              />
            </Field>
          </>
        )}
        <Field label={t.tags}>
          <Input
            value={(p.tags ?? []).join(", ")}
            onChange={(e) =>
              setP({ ...p, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
            }
            placeholder="learning, energy"
          />
        </Field>
        <Field label={t.wuxing}>
          <Input
            value={(p.wuxing ?? []).join(", ")}
            onChange={(e) =>
              setP({ ...p, wuxing: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
            }
            placeholder="wood, earth"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!p.featured}
            onChange={(e) => setP({ ...p, featured: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t.featured}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.active !== false}
            onChange={(e) => setP({ ...p, active: e.target.checked })}
            className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t.active}
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <PrimaryBtn
          onClick={() => onSave(p as Partial<Product> & { id: string })}
          disabled={busy || !p.id || !p.url || !p.category || (!p.titleEn && !p.titleZh)}
        >
          {t.save}
        </PrimaryBtn>
        <GhostBtn onClick={onCancel}>{t.cancel}</GhostBtn>
      </div>
    </div>
  );
}
