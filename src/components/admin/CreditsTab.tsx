"use client";
import { useState } from "react";
import { useAdmin, Card, Field, Input, PrimaryBtn, GhostBtn, Badge, SectionTitle, EmptyState } from "./ui";
import type { Credit } from "./types";

export function CreditsTab({
  credits,
  counts,
  onGenerate,
  generated,
}: {
  credits: Credit[];
  counts: { total: number; unused: number; used: number };
  onGenerate: (count: number, expiresInDays: number) => Promise<void>;
  generated: Array<{ code: string }>;
}) {
  const { t, toast, busy } = useAdmin();
  const [count, setCount] = useState(5);
  const [days, setDays] = useState(365);

  async function handleGenerate() {
    await onGenerate(count, days);
    toast(t.creditGenerate + " ✓", "ok");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{t.tabCredits}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge color="green">Unused: {counts.unused}</Badge>
          <Badge color="zinc">Used: {counts.used}</Badge>
        </div>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {t.creditGenerate}
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t.creditCount}>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
              className="!w-20"
            />
          </Field>
          <Field label={t.creditExpiresDays}>
            <Input
              type="number"
              min={0}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value || "0", 10))}
              className="!w-24"
            />
          </Field>
          <PrimaryBtn onClick={handleGenerate} disabled={busy}>
            {t.creditGenerate}
          </PrimaryBtn>
        </div>
      </Card>

      {generated.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t.generatedCodes}
            </div>
            <GhostBtn
              onClick={() => {
                navigator.clipboard.writeText(generated.map((c) => c.code).join("\n"));
                toast(t.copied, "ok");
              }}
              className="!text-xs"
            >
              {t.copyAll}
            </GhostBtn>
          </div>
          <div className="space-y-0.5 font-mono text-sm">
            {generated.map((c, i) => (
              <div key={i} className="text-emerald-700 dark:text-emerald-300">
                {c.code}
              </div>
            ))}
          </div>
        </Card>
      )}

      {credits.length === 0 ? (
        <EmptyState>{t.noCredits}</EmptyState>
      ) : (
        <div className="space-y-1">
          {credits.slice(0, 50).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <code className="max-w-full break-all rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                {c.code}
              </code>
              {c.used ? (
                <Badge color="zinc">{t.creditUsed}</Badge>
              ) : (
                <Badge color="green">✓</Badge>
              )}
              {c.expiresAt && (
                <span className="text-xs text-zinc-400">
                  {t.creditExpires}: {new Date(c.expiresAt).toISOString().slice(0, 10)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
