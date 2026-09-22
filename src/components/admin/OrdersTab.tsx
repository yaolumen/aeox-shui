"use client";
import { useState } from "react";
import { useAdmin, Modal, Card, Field, Input, PrimaryBtn, GhostBtn, Badge, SectionTitle, EmptyState } from "./ui";
import type { Order } from "./types";

export function OrdersTab({
  orders,
  counts,
  onStatusChange,
  onUpdate,
}: {
  orders: Order[];
  counts: { total: number; pending: number; paid: number; delivered: number };
  onStatusChange: (id: string, status: string) => Promise<void>;
  onUpdate: (id: string, data: { trackingNo?: string; deliveryNote?: string; status?: string }) => Promise<void>;
}) {
  const { t, toast, busy } = useAdmin();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  async function handleMarkPaid(id: string) {
    await onStatusChange(id, "paid");
    toast(t.orderMarkPaid + " ✓", "ok");
  }

  async function handleMarkDelivered(id: string) {
    await onStatusChange(id, "delivered");
    toast(t.orderMarkDelivered + " ✓", "ok");
  }

  async function handleDeliverWithTracking() {
    if (!editingOrder) return;
    await onUpdate(editingOrder.id, {
      trackingNo: editingOrder.trackingNo ?? "",
      deliveryNote: editingOrder.deliveryNote ?? "",
      status: "delivered",
    });
    setEditingOrder(null);
    toast(t.orderMarkDelivered + " ✓", "ok");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{t.tabOrders}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge color="zinc">{t.orderPending}: {counts.pending}</Badge>
          <Badge color="amber">{t.orderPaid}: {counts.paid}</Badge>
          <Badge color="green">{t.orderDelivered}: {counts.delivered}</Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState>{t.noOrders}</EmptyState>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {o.id.slice(0, 8)}
                </code>
                <Badge
                  color={
                    o.status === "delivered"
                      ? "green"
                      : o.status === "paid"
                      ? "amber"
                      : "zinc"
                  }
                >
                  {o.status === "delivered"
                    ? t.orderDelivered
                    : o.status === "paid"
                    ? t.orderPaid
                    : t.orderPending}
                </Badge>
                <Badge color="zinc">{o.productType}</Badge>
                {o.buyerEmail && <span className="text-xs text-zinc-500">{o.buyerEmail}</span>}
                {o.amount && <span className="text-xs text-zinc-500">{o.amount}</span>}
                {o.trackingNo && <Badge color="blue">📦 {o.trackingNo}</Badge>}
                <span className="ml-auto text-xs text-zinc-400">
                  {new Date(o.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.status === "pending" && (
                  <PrimaryBtn
                    onClick={() => handleMarkPaid(o.id)}
                    disabled={busy}
                    className="!bg-amber-600 hover:!bg-amber-700"
                  >
                    {t.orderMarkPaid}
                  </PrimaryBtn>
                )}
                {o.status === "paid" && o.productType === "physical" && (
                  <PrimaryBtn
                    onClick={() => setEditingOrder(o)}
                    className="!bg-emerald-600 hover:!bg-emerald-700"
                  >
                    {t.orderMarkDelivered}
                  </PrimaryBtn>
                )}
                {o.status === "paid" && o.productType !== "physical" && (
                  <PrimaryBtn
                    onClick={() => handleMarkDelivered(o.id)}
                    disabled={busy}
                    className="!bg-emerald-600 hover:!bg-emerald-700"
                  >
                    {t.orderMarkDelivered}
                  </PrimaryBtn>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title={t.orderMarkDelivered}
      >
        {editingOrder && (
          <div className="space-y-4">
            <Field label={t.orderTracking}>
              <Input
                value={editingOrder.trackingNo ?? ""}
                onChange={(e) => setEditingOrder({ ...editingOrder, trackingNo: e.target.value })}
              />
            </Field>
            <Field label={t.orderNote}>
              <Input
                value={editingOrder.deliveryNote ?? ""}
                onChange={(e) => setEditingOrder({ ...editingOrder, deliveryNote: e.target.value })}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <PrimaryBtn onClick={handleDeliverWithTracking} disabled={busy}>
                {t.orderMarkDelivered}
              </PrimaryBtn>
              <GhostBtn onClick={() => setEditingOrder(null)}>{t.cancel}</GhostBtn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
