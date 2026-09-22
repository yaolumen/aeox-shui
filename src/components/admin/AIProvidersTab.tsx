"use client";
import { useState, useCallback } from "react";
import { useAdmin, Modal, Card, Field, Input, PrimaryBtn, GhostBtn, DangerBtn, Badge, SectionTitle, EmptyState } from "./ui";
import type { AIProvider, TestResult } from "./types";

export function AIProvidersTab({
  providers,
  onSave,
  onDelete,
  onTest,
  onSeedFromEnv,
}: {
  providers: AIProvider[];
  onSave: (p: Partial<AIProvider> & { id: string }) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => Promise<void>;
  onSeedFromEnv: () => Promise<void>;
}) {
  const { t, toast, busy } = useAdmin();
  const [editing, setEditing] = useState<Partial<AIProvider> | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [testingAll, setTestingAll] = useState(false);

  async function handleTest(id: string) {
    setTestingIds((prev) => new Set(prev).add(id));
    try {
      await onTest(id);
      const res = await fetch(`/api/v1/admin/ai-providers/${encodeURIComponent(id)}/test`, { method: "POST" });
      const data: TestResult = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: data }));
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: { ok: false, latencyMs: 0, error: "Network error" } }));
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleTestAll() {
    setTestingAll(true);
    const enabled = providers.filter((p) => p.enabled);
    for (const p of enabled) {
      await handleTest(p.id);
    }
    setTestingAll(false);
    toast(t.aiTestAllDone, "ok");
  }

  async function handleSeed() {
    await onSeedFromEnv();
    toast(t.aiSeeded, "ok");
  }

  async function handleSave(p: Partial<AIProvider> & { id: string }) {
    await onSave(p);
    setEditing(null);
    toast(t.saved, "ok");
  }

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await onDelete(id);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast(t.delete + " ✓", "ok");
  }

  function handleDuplicate(p: AIProvider) {
    const newId = prompt(t.aiDuplicateId, p.id + "-2");
    if (!newId) return;
    setEditing({
      id: newId,
      name: p.name,
      baseUrl: p.baseUrl,
      model: p.model,
      apiKeyLength: 0,
      apiKeyMasked: "",
      role: p.role,
      enabled: true,
      sortOrder: providers.length,
      note: p.note,
      createdAt: 0,
      updatedAt: 0,
    });
  }

  const handleMove = useCallback(async (p: AIProvider, direction: -1 | 1) => {
    const sorted = [...providers].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((x) => x.id === p.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapWith = sorted[swapIdx];
    if (!swapWith) return;
    await onSave({ ...p, sortOrder: swapWith.sortOrder });
    await onSave({ ...swapWith, sortOrder: p.sortOrder });
  }, [providers, onSave]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle>{t.aiTitle}</SectionTitle>
          <p className="text-sm text-zinc-500">{t.aiSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <GhostBtn onClick={handleSeed}>{t.aiSeedFromEnv}</GhostBtn>
          {providers.length > 0 && (
            <GhostBtn onClick={handleTestAll} disabled={busy || testingAll || testingIds.size > 0}>
              {testingAll ? "..." : t.aiTestAll}
            </GhostBtn>
          )}
          <PrimaryBtn
            onClick={() =>
              setEditing({
                id: "",
                name: "",
                baseUrl: "https://",
                model: "",
                apiKeyLength: 0,
                apiKeyMasked: "",
                role: "primary",
                enabled: true,
                sortOrder: providers.length,
                note: "",
                createdAt: 0,
                updatedAt: 0,
              } as Partial<AIProvider>)
            }
          >
            + {t.aiAdd}
          </PrimaryBtn>
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.name ? t.edit : t.aiAdd}
      >
        {editing && (
          <AIProviderForm
            initial={editing}
            t={t}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </Modal>

      {providers.length === 0 ? (
        <EmptyState>{t.aiNoProviders}</EmptyState>
      ) : (
        <div className="space-y-2">
          {[...providers]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((p) => {
              const r = testResults[p.id];
              const isTesting = testingIds.has(p.id);
              return (
                <Card key={p.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                      {p.id}
                    </code>
                    <span className="font-semibold">{p.name}</span>
                    {p.enabled ? (
                      <Badge color="green">{t.on}</Badge>
                    ) : (
                      <Badge color="zinc">{t.off}</Badge>
                    )}
                    <Badge color={p.role === "primary" ? "amber" : "blue"}>
                      {p.role === "primary" ? `⚡ ${t.aiRolePrimary}` : `↻ ${t.aiRoleFallback}`}
                    </Badge>
                    <Badge color="indigo">{p.model}</Badge>
                    <span className="ml-auto flex gap-1.5">
                      <button
                        onClick={() => handleMove(p, -1)}
                        disabled={busy || p.sortOrder === 0}
                        className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                        title={t.aiMoveUp}
                      >↑</button>
                      <button
                        onClick={() => handleMove(p, 1)}
                        disabled={busy}
                        className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                        title={t.aiMoveDown}
                      >↓</button>
                    </span>
                    <span className="flex gap-1.5">
                      <GhostBtn
                        onClick={() => handleTest(p.id)}
                        disabled={busy || isTesting}
                      >
                        {isTesting ? "..." : t.aiTest}
                      </GhostBtn>
                      <GhostBtn onClick={() => setEditing(p)}>
                        {t.edit}
                      </GhostBtn>
                      <GhostBtn onClick={() => handleDuplicate(p)}>
                        {t.aiDuplicate}
                      </GhostBtn>
                      <DangerBtn
                        onClick={() => handleDelete(p.id)}
                        disabled={busy || isTesting}
                      >
                        {t.delete}
                      </DangerBtn>
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {p.baseUrl} · key: <code className="max-w-full break-all rounded bg-zinc-100 px-1 dark:bg-zinc-800">{p.apiKeyMasked}</code>{" "}
                    ({p.apiKeyLength} chars)
                  </div>
                  {p.note && <div className="mt-1 text-xs text-zinc-500">{p.note}</div>}
                  {r && (
                    <div
                      className={`mt-3 rounded-lg border p-3 text-xs ${
                        r.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                          : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
                      }`}
                    >
                      <span className="font-semibold">
                        {r.ok ? `✓ ${t.aiTestOk}` : `✗ ${t.aiTestFail}`}
                      </span>{" "}
                      · {r.latencyMs}ms
                      {r.ok && r.sample && (
                        <div className="mt-1 italic">&ldquo;{r.sample}&rdquo;</div>
                      )}
                      {!r.ok && r.error && (
                        <div className="mt-1 break-words font-mono">{r.error}</div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

function AIProviderForm({
  initial,
  t,
  busy,
  onCancel,
  onSave,
}: {
  initial: Partial<AIProvider>;
  t: (typeof import("./types").T)[keyof typeof import("./types").T];
  busy: boolean;
  onCancel: () => void;
  onSave: (p: Partial<AIProvider> & { id: string }) => void;
}) {
  const isNew = !initial.id;
  const [p, setP] = useState<Partial<AIProvider>>(initial);
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t.aiProviderId}>
          <Input
            value={p.id ?? ""}
            onChange={(e) => setP({ ...p, id: e.target.value })}
            disabled={!isNew}
            placeholder="zhipu / nvidia-nim / openrouter"
            className="font-mono"
          />
        </Field>
        <Field label={t.aiName}>
          <Input
            value={p.name ?? ""}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            placeholder="Zhipu GLM-4-Flash"
          />
        </Field>
        <Field label={t.aiBaseUrl}>
          <Input
            value={p.baseUrl ?? ""}
            onChange={(e) => setP({ ...p, baseUrl: e.target.value })}
            placeholder="https://open.bigmodel.cn/api/paas/v4"
            className="font-mono"
          />
        </Field>
        <Field label={t.aiModel}>
          <Input
            value={p.model ?? ""}
            onChange={(e) => setP({ ...p, model: e.target.value })}
            placeholder="glm-4-flash"
            className="font-mono"
          />
        </Field>
        <Field label={t.aiApiKey}>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={isNew ? "sk-..." : "(leave blank to keep current)"}
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <Field label={t.aiSortOrder}>
          <Input
            type="number"
            value={p.sortOrder ?? 0}
            onChange={(e) => setP({ ...p, sortOrder: parseInt(e.target.value || "0", 10) })}
          />
        </Field>
        <Field label={t.aiRole}>
          <select
            value={p.role ?? "primary"}
            onChange={(e) => setP({ ...p, role: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-indigo-400"
          >
            <option value="primary">{`⚡ ${t.aiRolePrimary}`}</option>
            <option value="fallback">{`↻ ${t.aiRoleFallback}`}</option>
          </select>
        </Field>
      </div>
      <Field label={t.aiNote}>
        <Input
          value={p.note ?? ""}
          onChange={(e) => setP({ ...p, note: e.target.value })}
          placeholder="e.g. free tier, 60 rpm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={p.enabled !== false}
          onChange={(e) => setP({ ...p, enabled: e.target.checked })}
          className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        {t.aiEnabled}
      </label>
      <div className="flex gap-2 pt-2">
        <PrimaryBtn
          onClick={() => {
            const payload: Partial<AIProvider> & { id: string; apiKey?: string } = {
              ...p,
              id: p.id ?? "",
            };
            if (apiKey) payload.apiKey = apiKey;
            onSave(payload);
          }}
          disabled={busy || !p.id || !p.name || !p.baseUrl || !p.model || (isNew && !apiKey)}
        >
          {t.save}
        </PrimaryBtn>
        <GhostBtn onClick={onCancel}>{t.cancel}</GhostBtn>
      </div>
    </div>
  );
}
