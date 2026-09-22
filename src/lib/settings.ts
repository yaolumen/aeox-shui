/**
 * Settings helper — typed access to the settings table
 * Quantum Fate Lite
 */
import { setSetting, getSettingsMap } from "@/lib/db";

export type MonetizationMode = "ecommerce" | "freemium";
export type PaymentProvider = "stripe" | "paypal" | "none";

const CACHE_TTL_MS = 5000;
let settingsCache: { data: Record<string, string> | null; ts: number } = { data: null, ts: 0 };

function getSettingsMapCached(): Record<string, string> {
  const now = Date.now();
  if (settingsCache.data && now - settingsCache.ts < CACHE_TTL_MS) {
    return settingsCache.data;
  }
  const map = getSettingsMap();
  settingsCache = { data: map, ts: now };
  return map;
}

export interface AppSettings {
  monetization_mode: MonetizationMode;
  payment_provider: PaymentProvider;
  premium_price_usd: string;
  premium_price_cny: string;
  premium_max_tokens: string;
  premium_template: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  paypal_client_id: string;
  paypal_secret: string;
  paypal_sandbox: string;
  site_name: string;
  site_url: string;
  site_brand_title: string;
  site_brand_title_zh: string;
  site_brand_subtitle: string;
  site_brand_subtitle_zh: string;
  report_free_limit_hour: string;
  report_premium_limit_hour: string;
  report_ttl_hours: string;
  admin_session_ttl_hours: string;
  show_product_recommendations: string;
  contact_email: string;
  ai_scheduling_mode: string;
  style_preset: string;
  style_icon: string;
  style_columns: string;
  style_card_layout: string;
  site_default_locale: string;
  admin_default_locale: string;
}

export const DEFAULTS: AppSettings = {
  monetization_mode: "ecommerce",
  payment_provider: "none",
  premium_price_usd: "4.99",
  premium_price_cny: "29.9",
  premium_max_tokens: "4096",
  premium_template: "premium",
  stripe_secret_key: "",
  stripe_webhook_secret: "",
  paypal_client_id: "",
  paypal_secret: "",
  paypal_sandbox: "1",
  site_name: "Shui",
  site_url: "",
  site_brand_title: "Shui",
  site_brand_title_zh: "水 · 节律",
  site_brand_subtitle: "Decode Your Personal Energy Cycle",
  site_brand_subtitle_zh: "解码你的个人能量周期",
  report_free_limit_hour: "3",
  report_premium_limit_hour: "10",
  report_ttl_hours: "24",
  admin_session_ttl_hours: "2",
  show_product_recommendations: "1",
  contact_email: "",
  ai_scheduling_mode: "priority",
  style_preset: "indigo",
  style_icon: "wuxing",
  style_columns: "2",
  style_card_layout: "horizontal",
  site_default_locale: "en",
  admin_default_locale: "zh-CN",
};

export function getSettingOrDefault<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const map = getSettingsMapCached();
  const val = map[key];
  return (val ?? DEFAULTS[key]) as AppSettings[K];
}

export function setSettingValue<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  setSetting(key, String(value));
  settingsCache = { data: null, ts: 0 };
}

export function getAllSettingsWithDefaults(): AppSettings {
  const map = getSettingsMapCached();
  const result: AppSettings = { ...DEFAULTS };
  const keys = Object.keys(DEFAULTS) as Array<keyof AppSettings>;
  for (const k of keys) {
    if (map[k] !== undefined) {
      (result as unknown as Record<string, string>)[k] = map[k];
    }
  }
  return result;
}

export function isFreemiumMode(): boolean {
  return getSettingOrDefault("monetization_mode") === "freemium";
}

export function isEcommerceMode(): boolean {
  return getSettingOrDefault("monetization_mode") === "ecommerce";
}

export function isPaymentConfigured(): boolean {
  const provider = getSettingOrDefault("payment_provider");
  if (provider === "stripe") {
    return Boolean(getSettingOrDefault("stripe_secret_key"));
  }
  if (provider === "paypal") {
    return Boolean(getSettingOrDefault("paypal_client_id")) && Boolean(getSettingOrDefault("paypal_secret"));
  }
  return false;
}

export interface StylePreset {
  theme: string;
  icon: string;
  columns: number;
  cardLayout: string;
}

export function getStylePreset(): StylePreset {
  const theme = getSettingOrDefault("style_preset");
  const icon = getSettingOrDefault("style_icon");
  const columns = parseInt(getSettingOrDefault("style_columns"), 10) || 2;
  const cardLayout = getSettingOrDefault("style_card_layout");
  const validThemes = ["indigo", "dark", "warm", "glass"];
  const validIcons = ["wuxing", "moon"];
  const validLayouts = ["horizontal", "vertical", "square"];
  return {
    theme: validThemes.includes(theme) ? theme : "indigo",
    icon: validIcons.includes(icon) ? icon : "wuxing",
    columns: columns === 1 ? 1 : 2,
    cardLayout: validLayouts.includes(cardLayout) ? cardLayout : "horizontal",
  };
}
