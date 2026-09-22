import type { Locale } from "@/lib/config";
import en from "@/i18n/messages/en.json";
import zhCN from "@/i18n/messages/zh-CN.json";

type Dict = Record<string, string>;
const DICTS: Record<Locale, Dict> = {
  en: en as Dict,
  "zh-CN": zhCN as Dict,
};

export const LOCALE_COOKIE = "shui_lang";
export const VALID_LOCALES: Locale[] = ["en", "zh-CN"];

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const d = DICTS[locale] ?? DICTS.en;
  let s = d[key];
  if (s == null) {
    s = DICTS.en[key] ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function resolveLocale(
  acceptLanguage: string | null,
  cookieLang: string | null | undefined,
  queryLang: string | null | undefined,
  defaultLocale: Locale
): Locale {
  if (queryLang && VALID_LOCALES.includes(queryLang as Locale)) {
    return queryLang as Locale;
  }
  if (cookieLang && VALID_LOCALES.includes(cookieLang as Locale)) {
    return cookieLang as Locale;
  }
  if (acceptLanguage) {
    const lowered = acceptLanguage.toLowerCase();
    if (lowered.includes("zh")) return "zh-CN";
    if (lowered.includes("en")) return "en";
  }
  return defaultLocale;
}

export function pickLocale(acceptLanguage: string | null, defaultLocale: Locale): Locale {
  return resolveLocale(acceptLanguage, null, null, defaultLocale);
}

export const DICT_KEYS = {
  en: Object.keys(DICTS.en),
  "zh-CN": Object.keys(DICTS["zh-CN"]),
};
