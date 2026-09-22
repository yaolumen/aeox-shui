"use client";
import { useState, useEffect, useMemo } from "react";
import type { Locale } from "@/lib/config";
import { Disclaimer } from "@/components/Disclaimer";
import { ShareCardModal } from "@/components/ShareCardModal";
import { PdfDownloadModal } from "@/components/PdfDownloadModal";
import type { WuxingStats } from "@/lib/bazi";
import { marked } from "marked";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = typeof window !== "undefined" ? require("dompurify") : null;

interface RecommendationView {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  price: string | null;
  matchScore: number;
  matchReasons: string[];
  productType?: string;
  deliveryInfo?: Record<string, string> | null;
}

interface AnalysisView {
  baziString: string[];
  wuxing: WuxingStats;
  dayMaster: string;
  dayMasterWuxing: string;
  dayMasterStrength: string;
  favorableElements: string[];
  unfavorableElements: string[];
}

interface Props {
  id: string;
  locale: Locale;
  content: string;
  analysis: AnalysisView;
  recommendations: RecommendationView[];
  ai: { provider: string | null; model: string | null; latencyMs: number | null };
  fateBook: string;
  tier?: string;
  createdAt: number;
  monetizationMode?: "ecommerce" | "freemium";
  ttlHours?: number;
  style?: { theme: string; icon: string; columns: number; cardLayout: string };
}

const T = {
  en: {
    title: "Personal Energy Cycle Report",
    premiumTitle: "In-Depth Energy Profile",
    id: "Report ID",
    bazi: "Temporal Energy Vector",
    wuxing: "Elemental Balance",
    dayMaster: "Core Element",
    strength: "Energy Level",
    favorable: "Energy Catalysts",
    unfavorable: "Elements to Observe",
    aiMeta: "Powered by Shui Algorithmic Engine",
    share: "Share",
    copied: "Copied!",
    inviteText: "I just decoded my Personal Energy Profile on Shui! 🌿 Check your seasonal rhythm: https://shui.aeox.uk",
    recommendations: "Recommended For You",
    recsNote:
      "As an affiliate partner, we may earn a small commission from qualifying purchases made through links below, at no extra cost to you.",
    tierFree: "Foundation",
    tierPremium: "In-Depth",
    buyNow: "Get This",
    download: "Download",
    downloadPdf: "PDF",
    accessPassword: "Password",
    viewProduct: "View Product",
    trackingInfo: "Tracking",
    expiresIn: "Expires in",
    downloadNow: "Download or save your report now.",
    classic: "Classic",
  },
  "zh-CN": {
    title: "个人能量周期报告",
    premiumTitle: "深度能量节律图谱",
    id: "报告编号",
    bazi: "时间能量向量",
    wuxing: "五行平衡",
    dayMaster: "核心元素",
    strength: "能量水平",
    favorable: "能量催化剂",
    unfavorable: "需关注元素",
    aiMeta: "由水·节律算法引擎驱动",
    share: "分享",
    copied: "已复制！",
    inviteText: "我刚在 Shui 上解码了我的个人能量图谱！🌿 来查看你的季节节律：https://shui.aeox.uk",
    recommendations: "为你推荐",
    recsNote: "作为联盟合作伙伴，我们可能从下方链接的合格购买中赚取少量佣金，不增加您的费用。",
    tierFree: "基础版",
    tierPremium: "深度版",
    buyNow: "获取",
    download: "下载",
    downloadPdf: "PDF",
    accessPassword: "提取码",
    viewProduct: "查看商品",
    trackingInfo: "物流",
    expiresIn: "后过期",
    downloadNow: "请立即下载或保存报告。",
    classic: "典籍",
  },
} as const;

const STRENGTH_LABEL = {
  en: { strong: "High Energy", weak: "Low Energy", neutral: "Balanced" },
  "zh-CN": { strong: "高能量", weak: "低能量", neutral: "平衡" },
} as const;

const WX_EN: Record<string, string> = {
  木: "Wood", 火: "Fire", 土: "Earth", 金: "Metal", 水: "Water",
  wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water",
};

const WX_ICON: Record<string, string> = {
  wood: "🌿", fire: "🔥", earth: "⛰️", metal: "🪙", water: "💧",
  木: "🌿", 火: "🔥", 土: "⛰️", 金: "🪙", 水: "💧",
};

function wxName(w: string, locale: Locale): string {
  if (locale === "en") {
    if (WX_EN[w]) return WX_EN[w]!;
    const lower = w.toLowerCase();
    if (WX_EN[lower]) return WX_EN[lower]!;
    return w;
  }
  const map: Record<string, string> = {
    Wood: "木", Fire: "火", Earth: "土", Metal: "金", Water: "水",
    wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
  };
  return map[w] ?? w;
}

function useExpiryCountdown(createdAt: number, ttlHours: number = 24) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const expiresAt = createdAt + ttlHours * 60 * 60 * 1000;
    function tick() {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [createdAt, ttlHours]);

  if (remaining <= 0) return null;
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return { hours, minutes };
}

export function ReportView(props: Props) {
  const { id, locale, content, analysis, recommendations, ai, fateBook, createdAt, monetizationMode = "ecommerce", ttlHours = 24, style } = props;
  const t = T[locale];
  const isEcommerce = monetizationMode === "ecommerce";
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const expiry = useExpiryCountdown(createdAt, ttlHours);

  const htmlContent = useMemo(() => {
    const raw = marked.parse(content, { breaks: true, gfm: true });
    return typeof window !== "undefined" && DOMPurify ? DOMPurify.sanitize(String(raw)) : String(raw);
  }, [content]);

  const wuxingEntries = Object.entries(analysis.wuxing) as [string, number][];
  const maxVal = Math.max(...wuxingEntries.map(([, v]) => v), 1);

  return (
    <div className="mx-auto max-w-sm space-y-2 px-4 py-6 sm:max-w-2xl sm:px-6">
      <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        {expiry && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.expiresIn} <strong>{expiry.hours}h {expiry.minutes}m</strong> · {t.downloadNow}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t.downloadPdf}
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-600 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            {t.share}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        <span>{t.id}: </span>
        <code className="font-mono">{id.slice(0, 8)}</code>
        <span className="mx-2">·</span>
        <span>{t.aiMeta}</span>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.bazi} · {t.wuxing}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {analysis.baziString.map((p, i) => (
            <div
              key={i}
              className="flex min-w-[4rem] flex-col items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-lg dark:border-zinc-700 dark:bg-zinc-800"
            >
              {p}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {wuxingEntries.map(([k, v]) => {
            const pct = Math.round((v / maxVal) * 100);
            const icon = WX_ICON[k] ?? WX_ICON[k.toLowerCase()] ?? "⚪";
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm">{icon}</span>
                <span className="w-16 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {wxName(k, locale)}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-zinc-500">{v}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div>
            <span className="text-zinc-400">{t.dayMaster}: </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {analysis.dayMaster} ({wxName(analysis.dayMasterWuxing, locale)})
            </span>
          </div>
          <div>
            <span className="text-zinc-400">{t.strength}: </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {STRENGTH_LABEL[locale][analysis.dayMasterStrength as "strong" | "weak" | "neutral"] ?? analysis.dayMasterStrength}
            </span>
          </div>
          <div>
            <span className="text-zinc-400">{t.classic}: </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{fateBook}</span>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <span className="text-zinc-400">{t.favorable}: </span>
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            {analysis.favorableElements.map((w) => `${WX_ICON[w] ?? ""} ${wxName(w, locale)}`).join("  ") || "—"}
          </span>
        </div>
        <div className="mt-1 text-xs">
          <span className="text-zinc-400">{t.unfavorable}: </span>
          <span className="font-medium text-amber-700 dark:text-amber-300">
            {analysis.unfavorableElements.map((w) => `${WX_ICON[w] ?? ""} ${wxName(w, locale)}`).join("  ") || "—"}
          </span>
        </div>
      </div>

      <article
        className="report-article prose prose-sm prose-zinc max-w-none rounded-xl border border-zinc-200 bg-white/60 p-5 dark:prose-invert dark:border-zinc-800 dark:bg-zinc-900/40 [&>]:last:mb-0"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {recommendations.length > 0 && (
        <div className={`rounded-xl border p-4 dark:border-zinc-800 ${
          isEcommerce
            ? "border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/20 dark:to-violet-950/20"
            : "border-zinc-200 bg-white/60 dark:bg-zinc-900/40"
        }`}>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.recommendations}
            </h2>
            {isEcommerce && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">Pick</span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t.recsNote}
          </p>
          <div className="mt-3 space-y-2">
            {recommendations.map((r) => {
              const pType = r.productType || "online";
              const isPhysical = pType === "physical";

              if (isPhysical) {
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.title}</h3>
                      {r.price && (
                        <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          {r.price}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{r.description}</p>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">
                        {t.buyNow}
                      </a>
                    )}
                    {r.matchReasons.length > 0 && (
                      <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">
                        ✦ {r.matchReasons.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="block rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-indigo-500"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.title}</h3>
                    {r.price && (
                      <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {r.price}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{r.description}</p>
                  )}
                  {r.deliveryInfo?.downloadUrl && (
                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950/20">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300">{t.download}:</div>
                      <span className="break-all text-xs text-blue-600 dark:text-blue-400">
                        {r.deliveryInfo.downloadUrl}
                      </span>
                      {r.deliveryInfo.password && (
                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">{t.accessPassword}: <code className="font-mono">{r.deliveryInfo.password}</code></div>
                      )}
                    </div>
                  )}
                  {r.matchReasons.length > 0 && (
                    <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">
                      ✦ {r.matchReasons.join(" · ")}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <Disclaimer variant="compact" locale={locale} />

      <div className="text-center text-xs text-zinc-400">
        {new Date(createdAt).toISOString()}
      </div>

      <ShareCardModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        locale={locale}
        dayMaster={analysis.dayMaster}
        dayMasterWuxing={analysis.dayMasterWuxing}
        dayMasterStrength={analysis.dayMasterStrength}
        baziString={analysis.baziString}
        wuxing={analysis.wuxing}
        favorableElements={analysis.favorableElements}
        style={style ?? { theme: "indigo", icon: "wuxing", columns: 2, cardLayout: "horizontal" }}
      />

      <PdfDownloadModal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        locale={locale}
        reportId={id}
        style={{ theme: style?.theme ?? "indigo", icon: style?.icon ?? "wuxing", columns: style?.columns ?? 2 }}
      />
    </div>
  );
}
