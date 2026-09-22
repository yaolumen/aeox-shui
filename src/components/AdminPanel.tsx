"use client";
import { useEffect, useState, useCallback } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import {
  AdminContext,
  useToast,
  ToastContainer,
  SidebarShell,
  PrimaryBtn,
  Input,
} from "@/components/admin/ui";
import { StatsTab } from "@/components/admin/StatsTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { AIProvidersTab } from "@/components/admin/AIProvidersTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { AccountTab } from "@/components/admin/AccountTab";
import { CreditsTab } from "@/components/admin/CreditsTab";
import { StyleTab } from "@/components/admin/StyleTab";
import {
  T,
  type Locale,
  type TabId,
  type Product,
  type Stats,
  type AIProvider,
  type Order,
  type Settings,
  type Admin,
  type Credit,
} from "@/components/admin/types";

export function AdminPanel({ defaultLocale }: { defaultLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const t = T[locale];
  const [authed, setAuthed] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("stats");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderCounts, setOrderCounts] = useState({ total: 0, pending: 0, paid: 0, delivered: 0 });
  const [settings, setSettings] = useState<Settings>({});
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditCounts, setCreditCounts] = useState({ total: 0, unused: 0, used: 0 });
  const [generatedCredits, setGeneratedCredits] = useState<Array<{ code: string }>>([]);

  const { items: toasts, add: addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [p, s, a, o, st, ad, cr] = await Promise.all([
        fetch("/api/v1/admin/products").then((r) => { if (r.status === 401) throw new Error("session_expired"); return r.ok ? r.json() : null; }),
        fetch("/api/v1/admin/stats").then((r) => { if (r.status === 401) throw new Error("session_expired"); return r.ok ? r.json() : null; }),
        fetch("/api/v1/admin/ai-providers").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/admin/orders").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/admin/settings").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/admin/admins").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/v1/admin/credits").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (p) setProducts(p.products);
      if (s) setStats(s);
      if (a) setAiProviders(a.providers);
      if (o) { setOrders(o.orders); setOrderCounts(o.counts); }
      if (st) setSettings(st.settings);
      if (ad) setAdmins(ad.admins);
      if (cr) { setCredits(cr.credits); setCreditCounts(cr.counts); }
    } catch (err) {
      if (err instanceof Error && err.message === "session_expired") {
        setAuthed(false);
        return;
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/v1/admin/stats")
      .then((r) => { if (r.ok) setAuthed(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(fetchData, 30_000);
    const onVisible = () => { if (!document.hidden) fetchData(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [authed, fetchData]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: adminName || undefined, password }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError(t.maxAdminsReached);
        } else {
          setError(t.invalidLogin);
        }
        return;
      }
      await res.json();
      setAuthed(true);
      setPassword("");
      setAdminName("");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await fetch("/api/v1/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function onSaveProduct(p: Partial<Product> & { id: string }) {
    setBusy(true);
    try {
      const isNew = !products.find((x) => x.id === p.id);
      const url = isNew ? "/api/v1/admin/products" : `/api/v1/admin/products/${encodeURIComponent(p.id)}`;
      const method = isNew ? "POST" : "PATCH";
      const body: Record<string, unknown> = {
        ...(isNew ? { id: p.id } : {}),
        titleEn: p.titleEn, titleZh: p.titleZh,
        descriptionEn: p.descriptionEn ?? "", descriptionZh: p.descriptionZh ?? "",
        category: p.category,         productType: p.productType ?? "online",
        url: p.url, price: p.price ?? "", deliveryInfo: p.deliveryInfo ?? null,
        tags: p.tags ?? [], wuxing: p.wuxing ?? [], locales: p.locales ?? ["en", "zh-CN"],
        featured: !!p.featured, active: p.active !== false, sortOrder: p.sortOrder ?? 0,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { await fetchData(); }
      else { const data = await res.json().catch(() => ({})); setError((data as { error?: string }).error || "Save failed"); }
    } finally { setBusy(false); }
  }

  async function onDeleteProduct(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
      await fetchData();
    } finally { setBusy(false); }
  }

  async function onAISave(p: Partial<AIProvider> & { id: string }) {
    setBusy(true);
    try {
      const isNew = !aiProviders.find((x) => x.id === p.id);
      const url = isNew ? "/api/v1/admin/ai-providers" : `/api/v1/admin/ai-providers/${encodeURIComponent(p.id)}`;
      const method = isNew ? "POST" : "PATCH";
      const body: Record<string, unknown> = {
        name: p.name, baseUrl: p.baseUrl, model: p.model,
        role: p.role || "primary",
        enabled: p.enabled !== false, sortOrder: p.sortOrder ?? 0, note: p.note ?? "",
      };
      if (isNew) { body.id = p.id; body.apiKey = (p as Record<string, unknown>).apiKey ?? ""; }
      else {
        if ((p as Record<string, unknown>).apiKey) { body.apiKey = (p as Record<string, unknown>).apiKey; }
        if (p.role) { body.role = p.role; }
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { await fetchData(); }
      else { const data = await res.json().catch(() => ({})); setError((data as { error?: string }).error || "Save failed"); }
    } finally { setBusy(false); }
  }

  async function onAIDelete(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/ai-providers/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) setError(t.delete + " failed"); else await fetchData();
    } finally { setBusy(false); }
  }

  async function onAITest(_id: string) {
  }

  async function onSeedFromEnv() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/ai-providers/seed", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; inserted?: number; error?: string };
      if (res.ok) addToast(`✓ ${t.aiSeeded} (${data.inserted ?? 0})`, "ok");
      else if ((data as { error?: string }).error === "already_seeded") addToast("⚠ " + t.aiAlreadySeeded, "info");
      else addToast("✗ " + ((data as { error?: string }).error || "Seed failed"), "err");
      await fetchData();
    } finally { setBusy(false); }
  }

  async function onOrderStatusChange(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      await fetchData();
    } finally { setBusy(false); }
  }

  async function onOrderUpdate(id: string, data: { trackingNo?: string; deliveryNote?: string; status?: string }) {
    setBusy(true);
    try {
      await fetch(`/api/v1/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      await fetchData();
    } finally { setBusy(false); }
  }

  async function onChangePassword(newPwd: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/admins/super-admin", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPwd }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast((data as { error?: string }).error || "Failed", "err");
      }
    } finally { setBusy(false); }
  }

  async function onGenerateCredits(count: number, expiresInDays: number) {
    setBusy(true);
    setGeneratedCredits([]);
    try {
      const res = await fetch("/api/v1/admin/credits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, tier: "premium", expiresInDays }),
      });
      if (res.ok) {
        const data = (await res.json()) as { generated: Array<{ code: string }> };
        setGeneratedCredits(data.generated || []);
        await fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast((data as { error?: string }).error || "Generate failed", "err");
      }
    } finally { setBusy(false); }
  }

  async function onPurgeReports() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/reports", { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as { purged?: number };
        addToast(`${t.purgeDone} (${data.purged ?? 0})`, "ok");
        await fetchData();
      } else {
        addToast("Purge failed", "err");
      }
    } finally { setBusy(false); }
  }

  const tabs: Array<{ id: TabId; label: string; badge?: number }> = [
    { id: "stats", label: t.tabStats },
    { id: "products", label: t.tabProducts },
    { id: "orders", label: t.tabOrders, badge: orderCounts.pending },
    { id: "credits", label: t.tabCredits },
    { id: "ai", label: t.tabAI, badge: aiProviders.length },
    { id: "style", label: t.tabStyle },
    { id: "settings", label: t.tabSettings },
    { id: "admins", label: t.tabAdmins },
  ];

  if (!authed) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <Disclaimer variant="banner" locale={locale} />
          <h1 className="text-center text-2xl font-bold">{t.title}</h1>
          <div className="flex justify-center gap-2">
            {(["en", "zh-CN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  locale === l
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {l === "en" ? "EN" : "中"}
              </button>
            ))}
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t.adminName}</label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="super-admin" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t.password}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>}
            <PrimaryBtn className="!w-full" disabled={busy}>{t.signIn}</PrimaryBtn>
            {process.env.NODE_ENV !== "production" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {t.devHint}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ t, locale, setLocale, toast: addToast, busy, setBusy }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{t.title}</h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {t.adminSuper}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              v0.12.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(["en", "zh-CN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  locale === l
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {l === "en" ? "EN" : "中"}
              </button>
            ))}
          </div>
        </div>

        <SidebarShell tab={tab} setTab={setTab} tabs={tabs} onLogout={onLogout} t={t}>
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
              <button onClick={() => setError(null)} className="ml-2 rounded-md px-2 py-1 text-red-400 hover:bg-red-100 hover:text-red-600">✕</button>
            </div>
          )}

          {tab === "stats" && <StatsTab stats={stats} />}
          {tab === "products" && <ProductsTab products={products} onSave={onSaveProduct} onDelete={onDeleteProduct} />}
          {tab === "ai" && <AIProvidersTab providers={aiProviders} onSave={onAISave} onDelete={onAIDelete} onTest={onAITest} onSeedFromEnv={onSeedFromEnv} />}
          {tab === "orders" && <OrdersTab orders={orders} counts={orderCounts} onStatusChange={onOrderStatusChange} onUpdate={onOrderUpdate} />}
          {tab === "settings" && <SettingsTab settings={settings} onPurgeReports={onPurgeReports} />}
          {tab === "style" && <StyleTab settings={settings} latestReportId={stats?.recent?.[0]?.id} />}
          {tab === "admins" && <AccountTab admins={admins} onChangePassword={onChangePassword} />}
          {tab === "credits" && <CreditsTab credits={credits} counts={creditCounts} onGenerate={onGenerateCredits} generated={generatedCredits} />}
        </SidebarShell>
      </div>
      <ToastContainer items={toasts} />
    </AdminContext.Provider>
  );
}
