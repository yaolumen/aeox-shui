"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { ShareCard, type CardLayout, type CardTheme } from "@/components/ShareCard";
import type { Locale } from "@/lib/config";
import type { WuxingStats } from "@/lib/bazi";

interface StyleConfig {
  theme: string;
  icon: string;
  columns: number;
  cardLayout: string;
}

interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dayMaster: string;
  dayMasterWuxing: string;
  dayMasterStrength: string;
  baziString: string[];
  wuxing: WuxingStats;
  favorableElements: string[];
  style: StyleConfig;
}

const CARD_DIMS: Record<CardLayout, { w: number; h: number }> = {
  horizontal: { w: 630, h: 360 },
  vertical: { w: 630, h: 1120 },
  square: { w: 630, h: 630 },
};

const T = {
  en: {
    title: "Share Your Energy Profile",
    saveTip: "Long press or right-click the image to save",
    copyText: "Copy Share Text",
    copied: "Copied!",
    nativeShare: "Share via...",
    close: "Close",
    generating: "Generating...",
    orText: "or share as text",
    shareText: "Just decoded my Personal Energy Profile on Shui! 🌿 Check your seasonal rhythm at https://shui.aeox.uk",
  },
  "zh-CN": {
    title: "分享你的能量图谱",
    saveTip: "长按或右键保存图片",
    copyText: "复制分享文案",
    copied: "已复制！",
    nativeShare: "分享到...",
    close: "关闭",
    generating: "生成中...",
    orText: "或以文字方式分享",
    shareText: "我刚在 Shui 上解码了我的个人能量图谱！🌿 来查看你的季节节律：https://shui.aeox.uk",
  },
} as const;

const VALID_LAYOUTS: CardLayout[] = ["horizontal", "vertical", "square"];
const VALID_THEMES: CardTheme[] = ["indigo", "dark", "warm", "glass"];

function ensureLayout(v: string): CardLayout {
  return VALID_LAYOUTS.includes(v as CardLayout) ? (v as CardLayout) : "horizontal";
}

function ensureTheme(v: string): CardTheme {
  return VALID_THEMES.includes(v as CardTheme) ? (v as CardTheme) : "indigo";
}

export function ShareCardModal(props: ShareCardModalProps) {
  const {
    open, onClose, locale, dayMaster, dayMasterWuxing, dayMasterStrength,
    baziString, wuxing, favorableElements, style,
  } = props;
  const t = T[locale];
  const cardRef = useRef<HTMLDivElement>(null);
  const layout = ensureLayout(style.cardLayout);
  const theme = ensureTheme(style.theme);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const dims = CARD_DIMS[layout];

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: dims.w,
        height: dims.h,
        pixelRatio: 2,
        cacheBust: true,
      });
      setImageUrl(dataUrl);
    } catch {
      setImageUrl(null);
    } finally {
      setGenerating(false);
    }
  }, [dims]);

  useEffect(() => {
    if (open && !imageUrl && !generating) {
      const timer = setTimeout(generateImage, 100);
      return () => clearTimeout(timer);
    }
  }, [open, imageUrl, generating, generateImage]);

  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setGenerating(false);
    }
  }, [open]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(t.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [t.shareText]);

  const handleNativeShare = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], "shui-energy-card.png", { type: "image/png" });
      if (navigator.share) {
        await navigator.share({
          text: t.shareText,
          url: "https://shui.aeox.uk",
          files: [file],
        });
      }
    } catch {}
  }, [imageUrl, t.shareText]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">{t.title}</h2>

        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={cardRef}>
            <ShareCard
              locale={locale}
              dayMaster={dayMaster}
              dayMasterWuxing={dayMasterWuxing}
              dayMasterStrength={dayMasterStrength}
              baziString={baziString}
              wuxing={wuxing}
              favorableElements={favorableElements}
              layout={layout}
              theme={theme}
            />
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          {generating && (
            <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              {t.generating}
            </div>
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Energy Card"
              className="max-h-[40vh] rounded-xl shadow-lg"
              style={{ maxWidth: "100%" }}
            />
          )}
        </div>

        {imageUrl && (
          <>
            <p className="mb-3 text-center text-xs text-zinc-400">{t.saveTip}</p>
            <div className="flex gap-2">
              {typeof navigator !== "undefined" && !!navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
                >
                  {t.nativeShare}
                </button>
              )}
            </div>
          </>
        )}

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
          <span className="text-xs text-zinc-400">{t.orText}</span>
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{t.shareText}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {copied ? `✓ ${t.copied}` : t.copyText}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
