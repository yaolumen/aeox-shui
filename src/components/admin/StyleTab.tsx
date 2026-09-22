"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAdmin, Card, SectionTitle, Badge } from "./ui";
import type { Settings } from "./types";
import { toPng } from "html-to-image";
import { ShareCard } from "@/components/ShareCard";

const THEME_GRADIENTS: Record<string, string> = {
  indigo: "from-indigo-500 to-violet-600",
  dark: "from-zinc-800 to-indigo-900",
  warm: "from-amber-700 to-orange-800",
  glass: "from-indigo-400 to-purple-600",
};

const THEME_COLORS: Record<string, string> = {
  indigo: "#6366F1",
  dark: "#1e1b4b",
  warm: "#b45309",
  glass: "#818CF8",
};

const CARD_DIMS: Record<string, { w: number; h: number }> = {
  horizontal: { w: 630, h: 360 },
  vertical: { w: 630, h: 1120 },
  square: { w: 630, h: 630 },
};

const DUMMY_WUXING = { wood: 2, fire: 1, earth: 1, metal: 2, water: 1 };
const DUMMY_FAVORABLE = ["wood", "water"];

export function StyleTab({
  settings,
  latestReportId,
}: {
  settings: Settings;
  latestReportId?: string;
}) {
  const { t, locale, toast, busy, setBusy } = useAdmin();
  const [theme, setTheme] = useState(settings.style_preset || "indigo");
  const [icon, setIcon] = useState(settings.style_icon || "wuxing");
  const [columns, setColumns] = useState(settings.style_columns || "2");
  const [cardLayout, setCardLayout] = useState(settings.style_card_layout || "horizontal");
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(settings.style_preset || "indigo");
    setIcon(settings.style_icon || "wuxing");
    setColumns(settings.style_columns || "2");
    setCardLayout(settings.style_card_layout || "horizontal");
  }, [settings]);

  const generateCardPreview = useCallback(async () => {
    if (!cardRef.current) return;
    const dims = CARD_DIMS[cardLayout] || CARD_DIMS.horizontal;
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: dims.w,
        height: dims.h,
        pixelRatio: 1,
        cacheBust: true,
      });
      setCardImageUrl(dataUrl);
    } catch {
      setCardImageUrl(null);
    }
  }, [cardLayout]);

  useEffect(() => {
    const timer = setTimeout(generateCardPreview, 200);
    return () => clearTimeout(timer);
  }, [theme, icon, cardLayout, generateCardPreview]);

  async function save() {
    setBusy(true);
    try {
      const payload: Record<string, string> = {
        style_preset: theme,
        style_icon: icon,
        style_columns: columns,
        style_card_layout: cardLayout,
      };
      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast(t.styleSaved, "ok");
      } else {
        const data = await res.json().catch(() => ({}));
        toast((data as { error?: string }).error || "Save failed", "err");
      }
    } finally {
      setBusy(false);
    }
  }

  const themeLabels: Record<string, string> = {
    indigo: t.cardThemeIndigo,
    dark: t.cardThemeDark,
    warm: t.cardThemeWarm,
    glass: t.cardThemeGlass,
  };

  const previewThemeParam = theme;
  const previewUrl = latestReportId
    ? `/api/v1/report/${latestReportId}/preview?theme=${previewThemeParam}&icon=${icon}&columns=${columns}`
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle>{t.tabStyle}</SectionTitle>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.styleTheme}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["indigo", "dark", "warm", "glass"] as const).map((p) => {
                const active = theme === p;
                return (
                  <button
                    key={p}
                    onClick={() => setTheme(p)}
                    className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                      active
                        ? "border-indigo-500 ring-2 ring-indigo-500/30"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    <div className={`h-20 bg-gradient-to-br ${THEME_GRADIENTS[p]}`} />
                    <div className="px-2 py-2 text-center">
                      <span
                        className={`text-xs font-semibold ${
                          active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {themeLabels[p]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.styleIcon}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIcon("wuxing")}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  icon === "wuxing"
                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-lg">
                  ☯
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {t.styleIconWuxing}
                  </div>
                  <div className="text-xs text-zinc-400">🌿🔥⛰️🪙💧</div>
                </div>
              </button>
              <button
                onClick={() => setIcon("moon")}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  icon === "moon"
                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-lg">
                  🌙
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {t.styleIconMoon}
                  </div>
                  <div className="text-xs text-zinc-400">🌑🌒🌓🌕</div>
                </div>
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.styleColumns}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setColumns("1")}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  columns === "1"
                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <div className="mx-auto mb-2 h-16 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {t.styleColumns1}
                </div>
              </button>
              <button
                onClick={() => setColumns("2")}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  columns === "2"
                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <div className="mx-auto mb-2 flex h-16 gap-1">
                  <div className="h-full w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-full w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {t.styleColumns2}
                </div>
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.styleCardLayout}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { key: "horizontal", label: t.styleCardLayoutH, ratio: "9:5", hFactor: 0.35 },
                  { key: "vertical", label: t.styleCardLayoutV, ratio: "9:16", hFactor: 1.2 },
                  { key: "square", label: t.styleCardLayoutS, ratio: "1:1", hFactor: 0.7 },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCardLayout(item.key)}
                  className={`rounded-xl border-2 p-3 text-center transition-all ${
                    cardLayout === item.key
                      ? "border-indigo-500 ring-2 ring-indigo-500/30"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                  }`}
                >
                  <div
                    className="mx-auto mb-2 w-12 rounded-sm"
                    style={{
                      height: `${48 * item.hFactor}px`,
                      background: THEME_COLORS[theme] || THEME_COLORS.indigo,
                      opacity: 0.5,
                    }}
                  />
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </div>
                  <Badge color="zinc">{item.ratio}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <button
            onClick={save}
            disabled={busy}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            {busy ? "..." : t.styleSaveHint}
          </button>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.stylePdfPreview}
            </h3>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="h-[520px] w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
                title="PDF Preview"
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-700">
                {t.styleNoReport}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {t.styleCardPreview}
            </h3>
            <div
              style={{ position: "absolute", left: "-9999px", top: 0 }}
            >
              <div ref={cardRef}>
                <ShareCard
                  locale={locale}
                  dayMaster="甲"
                  dayMasterWuxing="wood"
                  dayMasterStrength="strong"
                  baziString={["甲子", "丙寅", "甲午", "乙丑"]}
                  wuxing={DUMMY_WUXING}
                  favorableElements={DUMMY_FAVORABLE}
                  layout={cardLayout as "horizontal" | "vertical" | "square"}
                  theme={theme as "indigo" | "dark" | "warm" | "glass"}
                />
              </div>
            </div>
            <div className="flex justify-center">
              {cardImageUrl ? (
                <img
                  src={cardImageUrl}
                  alt="Card Preview"
                  className="max-h-[400px] rounded-xl shadow-lg"
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
                  ...
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color="indigo">{themeLabels[theme]}</Badge>
              <Badge color="zinc">
                {icon === "wuxing" ? t.styleIconWuxing : t.styleIconMoon}
              </Badge>
              <Badge color="zinc">
                {columns === "1" ? t.styleColumns1 : t.styleColumns2}
              </Badge>
              <Badge color="zinc">
                {cardLayout === "horizontal"
                  ? t.styleCardLayoutH
                  : cardLayout === "vertical"
                  ? t.styleCardLayoutV
                  : t.styleCardLayoutS}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
