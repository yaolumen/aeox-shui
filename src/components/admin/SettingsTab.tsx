"use client";
import { useState, useEffect } from "react";
import { useAdmin, Card, Field, Input, Select, PrimaryBtn, DangerBtn, SectionTitle, Badge } from "./ui";
import type { Settings } from "./types";

interface CycleItem {
  id: string;
  name_en: string;
  name_zh: string;
  years: number;
  enabled: number;
  sort_order: number;
}

export function SettingsTab({
  settings,
  onPurgeReports,
}: {
  settings: Settings;
  onPurgeReports?: () => Promise<void>;
}) {
  const { t, locale, toast, busy, setBusy } = useAdmin();
  const [local, setLocal] = useState<Settings>(settings);
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [newCycle, setNewCycle] = useState({ id: "", name_en: "", name_zh: "", years: 1 });

  useEffect(() => { setLocal(settings); }, [settings]);
  useEffect(() => { fetchCycles(); }, []);

  async function fetchCycles() {
    try {
      const res = await fetch("/api/v1/admin/cycles");
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles ?? []);
      }
    } catch {}
  }

  async function saveCycle(c: Partial<CycleItem> & { id: string }) {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (res.ok) {
        await fetchCycles();
        toast(t.saved, "ok");
        setNewCycle({ id: "", name_en: "", name_zh: "", years: 1 });
      }
    } finally { setBusy(false); }
  }

  async function deleteCycle(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/admin/cycles/${encodeURIComponent(id)}`, { method: "DELETE" });
      await fetchCycles();
      toast(t.delete + " ✓", "ok");
    } finally { setBusy(false); }
  }

  const set = (key: string, value: string) => setLocal((prev) => ({ ...prev, [key]: value }));

  const mode = local.monetization_mode || "ecommerce";
  const paymentProvider = local.payment_provider || "none";
  const isEcommerce = mode === "ecommerce";
  const isFreemium = mode === "freemium";
  const showPayment = isFreemium;
  const showStripe = showPayment && paymentProvider === "stripe";
  const showPaypal = showPayment && paymentProvider === "paypal";
  const showPriceFields = isFreemium;

  async function handleSave() {
    const numericFields = ["premium_price_usd", "premium_price_cny", "premium_max_tokens", "report_ttl_hours", "admin_session_ttl_hours"];
    for (const field of numericFields) {
      const val = local[field];
      if (val && isNaN(Number(val))) {
        toast(`${field} must be a number`, "err");
        return;
      }
    }
    setBusy(true);
    try {
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(local)) {
        if (typeof v === "string" && v.includes("••••")) continue;
        filtered[k] = String(v);
      }
      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtered),
      });
      if (res.ok) {
        toast(t.settingsSaved, "ok");
      } else {
        const data = await res.json().catch(() => ({}));
        toast((data as { error?: string }).error || "Save failed", "err");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handlePurge() {
    if (!confirm(t.purgeConfirm)) return;
    if (onPurgeReports) {
      await onPurgeReports();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/reports", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(`${t.purgeDone} (${(data as { purged?: number }).purged ?? 0})`, "ok");
      } else {
        toast("Purge failed", "err");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle>{t.tabSettings}</SectionTitle>

      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {locale === "zh-CN" ? "品牌与称谓" : "Brand & Identity"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.settingBrandTitle}>
                <Input
                  value={local.site_brand_title || "Shui"}
                  onChange={(e) => set("site_brand_title", e.target.value)}
                  placeholder="Shui"
                />
              </Field>
              <Field label={t.settingBrandTitleZh}>
                <Input
                  value={local.site_brand_title_zh || "水 · 节律"}
                  onChange={(e) => set("site_brand_title_zh", e.target.value)}
                  placeholder="水 · 节律"
                />
              </Field>
              <Field label={t.settingBrandSubtitle}>
                <Input
                  value={local.site_brand_subtitle || ""}
                  onChange={(e) => set("site_brand_subtitle", e.target.value)}
                  placeholder="Decode Your Personal Energy Cycle"
                />
              </Field>
              <Field label={t.settingBrandSubtitleZh}>
                <Input
                  value={local.site_brand_subtitle_zh || ""}
                  onChange={(e) => set("site_brand_subtitle_zh", e.target.value)}
                  placeholder="解码你的个人能量周期"
                />
              </Field>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {locale === "zh-CN" ? "语言设置" : "Language Settings"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={locale === "zh-CN" ? "前台默认语言" : "Site Default Language"}>
                <Select
                  value={local.site_default_locale || "en"}
                  onChange={(e) => set("site_default_locale", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="zh-CN">中文</option>
                </Select>
              </Field>
              <Field label={locale === "zh-CN" ? "管理后台默认语言" : "Admin Default Language"}>
                <Select
                  value={local.admin_default_locale || "zh-CN"}
                  onChange={(e) => set("admin_default_locale", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="zh-CN">中文</option>
                </Select>
              </Field>
            </div>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {locale === "zh-CN"
                ? "前台语言影响用户访问时的默认显示；管理后台语言影响管理员登录后的默认显示。用户仍可通过语言切换手动更改。"
                : "Site language sets the default for visitors; Admin language sets the default for the admin panel. Users can still switch manually."}
            </p>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {isEcommerce ? t.ecommerce : t.freemium}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.settingMode}>
                <Select
                  value={mode}
                  onChange={(e) => {
                    const newMode = e.target.value;
                    set("monetization_mode", newMode);
                    if (newMode === "ecommerce") {
                      set("payment_provider", "none");
                    }
                  }}
                >
                  <option value="ecommerce">{t.ecommerce}</option>
                  <option value="freemium">{t.freemium}</option>
                </Select>
              </Field>

              <Field label={t.settingShowProducts}>
                <Select
                  value={local.show_product_recommendations || "1"}
                  onChange={(e) => set("show_product_recommendations", e.target.value)}
                >
                  <option value="1">{t.on}</option>
                  <option value="0">{t.off}</option>
                </Select>
              </Field>
            </div>

            {isEcommerce && (
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {locale === "zh-CN"
                  ? "电商模式：商品链接直接跳转购买，无需支付网关"
                  : "E-commerce mode: product links redirect to purchase, no payment gateway needed"}
              </p>
            )}
          </div>

          {showPriceFields && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  {t.freemium}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.settingPayment}>
                    <Select
                      value={paymentProvider}
                      onChange={(e) => set("payment_provider", e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                    </Select>
                  </Field>
                  <Field label={t.settingPremiumTokens}>
                    <Input
                      value={local.premium_max_tokens || ""}
                      onChange={(e) => set("premium_max_tokens", e.target.value)}
                      placeholder="3000"
                    />
                  </Field>
                  <Field label={t.settingPremiumPrice}>
                    <Input
                      value={local.premium_price_usd || ""}
                      onChange={(e) => set("premium_price_usd", e.target.value)}
                      placeholder="4.99"
                    />
                  </Field>
                  <Field label={t.settingPremiumPriceCny}>
                    <Input
                      value={local.premium_price_cny || ""}
                      onChange={(e) => set("premium_price_cny", e.target.value)}
                      placeholder="29.9"
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          {showStripe && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Stripe</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.settingStripeKey}>
                    <Input
                      type="password"
                      value={local.stripe_secret_key || ""}
                      onChange={(e) => set("stripe_secret_key", e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="font-mono"
                    />
                  </Field>
                  <Field label={t.settingStripeWebhook}>
                    <Input
                      type="password"
                      value={local.stripe_webhook_secret || ""}
                      onChange={(e) => set("stripe_webhook_secret", e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="font-mono"
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          {showPaypal && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">PayPal</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.settingPaypalClientId}>
                    <Input
                      value={local.paypal_client_id || ""}
                      onChange={(e) => set("paypal_client_id", e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="font-mono"
                    />
                  </Field>
                  <Field label={t.settingPaypalSecret}>
                    <Input
                      type="password"
                      value={local.paypal_secret || ""}
                      onChange={(e) => set("paypal_secret", e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="font-mono"
                    />
                  </Field>
                  <Field label={t.settingPaypalSandbox}>
                    <Select
                      value={local.paypal_sandbox || "1"}
                      onChange={(e) => set("paypal_sandbox", e.target.value)}
                    >
                      <option value="1">Sandbox</option>
                      <option value="0">Production</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </>
          )}

          <hr className="border-zinc-200 dark:border-zinc-700" />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {locale === "zh-CN" ? "报告与数据" : "Reports & Data"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.settingReportTTL}>
                <Input
                  type="number"
                  value={local.report_ttl_hours || "24"}
                  onChange={(e) => set("report_ttl_hours", e.target.value)}
                  placeholder="24"
                  min="1"
                />
              </Field>
              <Field label={t.settingAdminSessionTTL}>
                <Input
                  type="number"
                  value={local.admin_session_ttl_hours || "2"}
                  onChange={(e) => set("admin_session_ttl_hours", e.target.value)}
                  placeholder="2"
                  min="0.25"
                  step="0.25"
                />
              </Field>
              <Field label={t.settingFreeLimit}>
                <Input
                  value={local.report_free_limit_hour || "3"}
                  onChange={(e) => set("report_free_limit_hour", e.target.value)}
                  placeholder="3"
                />
              </Field>
              <Field label={t.settingPremiumLimit}>
                <Input
                  value={local.report_premium_limit_hour || "10"}
                  onChange={(e) => set("report_premium_limit_hour", e.target.value)}
                  placeholder="10"
                />
              </Field>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{t.settingReportTTLHint}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{t.settingAdminSessionTTLHint}</p>
            </div>
            <div className="mt-3">
              <DangerBtn onClick={handlePurge} disabled={busy}>
                {t.purgeReports}
              </DangerBtn>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {locale === "zh-CN" ? "AI 调度" : "AI Scheduling"}
            </h3>
            <Field label={t.settingSchedulingMode}>
              <Select
                value={local.ai_scheduling_mode || "priority"}
                onChange={(e) => set("ai_scheduling_mode", e.target.value)}
              >
                <option value="priority">{t.schedulingPriority}</option>
                <option value="round-robin">{t.schedulingRoundRobin}</option>
                <option value="random">{t.schedulingRandom}</option>
              </Select>
            </Field>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{t.settingSchedulingModeHint}</p>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.cycleManagement}
            </h3>
            {cycles.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {cycles.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">{c.id}</code>
                    <span className="text-sm">{c.name_en}</span>
                    <span className="text-sm text-zinc-500">/ {c.name_zh}</span>
                    <Badge color="indigo">{c.years}Y</Badge>
                    {c.enabled ? <Badge color="green">{t.on}</Badge> : <Badge color="zinc">{t.off}</Badge>}
                    <DangerBtn onClick={() => deleteCycle(c.id)} disabled={busy} className="ml-auto">
                      {t.delete}
                    </DangerBtn>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Field label={t.cycleId}>
                <Input value={newCycle.id} onChange={(e) => setNewCycle({ ...newCycle, id: e.target.value })} placeholder="1year" className="font-mono" />
              </Field>
              <Field label={t.cycleNameEn}>
                <Input value={newCycle.name_en} onChange={(e) => setNewCycle({ ...newCycle, name_en: e.target.value })} placeholder="Annual Energy" />
              </Field>
              <Field label={t.cycleNameZh}>
                <Input value={newCycle.name_zh} onChange={(e) => setNewCycle({ ...newCycle, name_zh: e.target.value })} placeholder="本年运势" />
              </Field>
              <Field label={t.cycleYears}>
                <Input type="number" value={newCycle.years} onChange={(e) => setNewCycle({ ...newCycle, years: parseInt(e.target.value || "1", 10) })} min="1" />
              </Field>
            </div>
            <PrimaryBtn
              onClick={() => saveCycle({ id: newCycle.id, name_en: newCycle.name_en, name_zh: newCycle.name_zh, years: newCycle.years, enabled: 1, sort_order: cycles.length })}
              disabled={busy || !newCycle.id || !newCycle.name_en || !newCycle.name_zh}
              className="mt-2"
            >
              + {t.cycleAdd}
            </PrimaryBtn>
          </div>

          <PrimaryBtn onClick={handleSave} disabled={busy}>
            {t.saveSettings}
          </PrimaryBtn>
        </div>
      </Card>
    </div>
  );
}
