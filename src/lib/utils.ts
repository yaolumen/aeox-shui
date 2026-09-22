/**
 * 通用工具函数
 * Quantum Fate Lite · 轻量化版本
 */

/**
 * 类名合并工具（轻量版 classnames）
 */
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * 站点配置 - 从环境变量读取
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Shui",
  nameZh: "水 · 节律",
  tagline: "AI-assisted Personal Energy Cycle Analysis",
  taglineZh: "AI 驱动的个人能量周期分析",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: process.env.NEXT_PUBLIC_SITE_LOCALE ?? "en",
  description:
    "Free AI-assisted personal energy cycle and chronobiological profile analysis. Environmental rhythm insights for learning & personal growth only.",
} as const;

/**
 * 命书枚举
 */
export const FATE_BOOKS = {
  sanming: "三命通会",
  zipingzhenquan: "子平真诠",
} as const;

export type FateBookId = keyof typeof FATE_BOOKS;

export function getFateBookName(id: FateBookId, locale: "zh-CN" | "en" = "en"): string {
  if (locale === "zh-CN") {
    return FATE_BOOKS[id];
  }
  return id === "sanming" ? "San Ming Tong Hui" : "Zi Ping Zhen Quan";
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
