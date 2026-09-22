/**
 * Config loader
 * Quantum Fate Lite · 读取 config/*.json
 */
import general from "../../config/general.json";
import prompts from "../../config/prompts.json";
import seo from "../../config/seo.json";
import products from "../../config/products.json";

export type Locale = "en" | "zh-CN";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "zh-CN"] as const;
export const DEFAULT_LOCALE: Locale =
  (general.i18n?.defaultLocale as Locale) || "en";

export const generalConfig = general;
export const promptsConfig = prompts;
export const seoConfig = seo;
export const productsConfig = products;

/**
 * 从模板 id + locale 取出 prompt 字符串，变量插值
 */
interface PromptTemplate {
  prompt?: Partial<Record<Locale, string>> & { en?: string };
}

export function renderTemplate(
  templateId: string,
  locale: Locale,
  variables: Record<string, string | number>
): string {
  const tpl = prompts.templates as Record<string, PromptTemplate>;
  const tmpl = tpl[templateId];
  if (!tmpl) {
    throw new Error(`Unknown prompt template: ${templateId}`);
  }
  let raw: string = tmpl.prompt?.[locale] ?? tmpl.prompt?.en ?? "";
  if (!raw) {
    throw new Error(`Template ${templateId} has no prompt for locale ${locale}`);
  }
  for (const [k, v] of Object.entries(variables)) {
    raw = raw.replaceAll(`{${k}}`, String(v));
  }
  return raw;
}

/**
 * 取出全局 system prompt
 */
export function getSystemPrompt(locale: Locale): string {
  const sp = prompts.global.systemPrompt as Record<string, string>;
  return sp[locale] ?? sp.en ?? "";
}

interface LegalText {
  short?: string | Partial<Record<Locale, string>>;
  long?: string | Partial<Record<Locale, string>>;
}

export function getLegal(
  part: "short" | "long",
  locale: Locale
): string {
  const dis = (general.legal as { disclaimer?: LegalText }).disclaimer?.[part];
  if (typeof dis === "string") return dis;
  if (!dis) return "";
  return dis[locale] ?? dis.en ?? "";
}
