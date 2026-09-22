/**
 * AI provider registry
 * Quantum Fate Lite · supports DB-backed configs with role-based routing
 */
import {
  getAIProvider,
  listEnabledAIProviders,
  type AIProviderRow,
} from "@/lib/db";
import { getSettingOrDefault } from "@/lib/settings";
import { fetchWithTimeout } from "@/lib/utils";
import { OpenAIResponseSchema } from "@/types/api";

export type AIProviderId = string;

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  preferred?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
  mock?: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  isConfigured: () => boolean;
  generate: (req: AIRequest) => Promise<AIResponse>;
}

interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  displayName: string;
  providerId: string;
}

export async function callOpenAICompatible(
  cfg: OpenAICompatibleConfig,
  req: AIRequest
): Promise<AIResponse> {
  const start = Date.now();
  const response = await fetchWithTimeout(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
    }),
  }, 60000);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${cfg.displayName} API ${response.status}: ${text.slice(0, 300)}`
    );
  }
  const data = OpenAIResponseSchema.parse(await response.json());
  return {
    content: data.choices[0]?.message?.content ?? "",
    provider: cfg.providerId,
    model: cfg.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
    latencyMs: Date.now() - start,
  };
}

function providerFromRow(row: AIProviderRow): AIProvider {
  return {
    id: row.id,
    name: row.name,
    isConfigured: () =>
      Boolean(row.api_key) && row.api_key.length >= 6 && row.enabled === 1,
    generate: async (req) =>
      callOpenAICompatible(
        {
          baseUrl: row.base_url,
          apiKey: row.api_key,
          model: row.model,
          displayName: row.name,
          providerId: row.id,
        },
        req
      ),
  };
}

const ENV_TEMPLATES: Array<{
  id: string;
  name: string;
  envKey: string;
  envUrl: string;
  defaultUrl: string;
  envModel: string;
  defaultModel: string;
}> = [
  {
    id: "agnes-ai",
    name: "Agnes AI (env)",
    envKey: "AGNES_AI_API_KEY",
    envUrl: "AGNES_AI_BASE_URL",
    defaultUrl: "https://apihub.agnes-ai.com/v1",
    envModel: "AGNES_AI_MODEL",
    defaultModel: "agnes-2.0-flash",
  },
  {
    id: "unorouter",
    name: "UnoRouter (env)",
    envKey: "UNOROUTER_API_KEY",
    envUrl: "UNOROUTER_BASE_URL",
    defaultUrl: "https://api.unorouter.com/v1",
    envModel: "UNOROUTER_MODEL",
    defaultModel: "gpt-oss-120b:free",
  },
  {
    id: "zhipu",
    name: "智谱 GLM (env)",
    envKey: "ZHIPU_API_KEY",
    envUrl: "ZHIPU_BASE_URL",
    defaultUrl: "https://open.bigmodel.cn/api/paas/v4",
    envModel: "ZHIPU_MODEL",
    defaultModel: "glm-4-flash",
  },
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM (env)",
    envKey: "NVIDIA_NIM_API_KEY",
    envUrl: "NVIDIA_NIM_BASE_URL",
    defaultUrl: "https://integrate.api.nvidia.com/v1",
    envModel: "NVIDIA_NIM_MODEL",
    defaultModel: "meta/llama-3.1-8b-instruct",
  },
];

function envProviders(): AIProvider[] {
  const out: AIProvider[] = [];
  for (const t of ENV_TEMPLATES) {
    const key = process.env[t.envKey];
    if (!key) continue;
    const baseUrl = process.env[t.envUrl] ?? t.defaultUrl;
    const model = process.env[t.envModel] ?? t.defaultModel;
    out.push({
      id: t.id,
      name: t.name,
      isConfigured: () => true,
      generate: async (req) =>
        callOpenAICompatible(
          {
            baseUrl,
            apiKey: key!,
            model,
            displayName: t.name,
            providerId: t.id,
          },
          req
        ),
    });
  }
  return out;
}

function createMockProvider(): AIProvider {
  return {
    id: "mock",
    name: "Mock (本地样例)",
    isConfigured: () => true,
    generate: async (req) => {
      await new Promise((r) => setTimeout(r, 800));
      const isZh =
        /[一-鿿]/.test(req.userPrompt) || req.systemPrompt.includes("节律");
      const content = isZh
        ? `【样例报告 · Mock】\n\n> 本报告由本地 Mock 生成，未调用真实 AI。\n> 在管理后台配置 AI Provider 后将自动启用真实分析。\n\n## 能量周期概述\n您的能量周期由天干地支组合而成，日主体现核心性格特质。整体格局稳健，五行分布有侧重。\n\n## 五行分析\n五行之中需关注能量催化剂与需关注元素的平衡，结合日主强弱判断取向。\n\n## 十神简析\n十神关系反映人事、财富、官运、学业等不同面向，建议结合大运流年综合判断。\n\n## 命格特质\n您的命格具备独特的性格优势与潜在挑战，宜顺势而为，扬长避短。\n\n## 生活节律建议\n- 调整生活节奏，配合五行取向\n- 选择合适的方位、颜色、行业\n- 保持身心调和，循序渐进`
        : `[Sample Report · Mock]\n\n> This report is generated locally by Mock (no real AI call).\n> Configure an AI Provider in the admin panel to enable real analysis.\n\n## Energy Cycle Overview\nYour Temporal Energy Vector is composed of Heavenly Stems and Earthly Branches. The Day Master reflects your core personality. Overall, the pattern is stable with distinct elemental emphasis.\n\n## Five Elements Analysis\nBalance the Energy Catalysts and Elements to Observe according to the strength of your Day Master.\n\n## Ten Gods Brief\nThe Ten Gods relationship reflects career, wealth, authority, and studies. Combine with Da Yun and Liu Nian for a complete reading.\n\n## Pattern Traits\nYour chart has unique strengths and challenges. Adapt to the flow and play to your strengths.\n\n## Life Rhythm Advice\n- Adjust your lifestyle to align with the favorable elements\n- Choose suitable directions, colors, and industries\n- Maintain balance in body and mind, progress step by step`;
      return {
        content,
        provider: "mock",
        model: "mock-foundation",
        usage: {
          promptTokens: req.userPrompt.length,
          completionTokens: content.length,
          totalTokens: req.userPrompt.length + content.length,
        },
        latencyMs: 800,
        mock: true,
      };
    },
  };
}

const _mock: AIProvider = createMockProvider();

const PROVIDER_CACHE_TTL_MS = 3000;
let providerCache: { data: AIProvider[] | null; ts: number } = { data: null, ts: 0 };

export function invalidateProviderCache(): void {
  providerCache = { data: null, ts: 0 };
}

function getOrderedProviders(): AIProvider[] {
  const now = Date.now();
  if (providerCache.data && now - providerCache.ts < PROVIDER_CACHE_TTL_MS) {
    return providerCache.data;
  }
  const dbList = listEnabledAIProviders();
  const dbProviders = dbList.map(providerFromRow);
  const list: AIProvider[] =
    dbProviders.length > 0 ? dbProviders : envProviders();
  if (!list.find((p) => p.id === "mock")) list.push(_mock);
  providerCache = { data: list, ts: now };
  return list;
}

type SchedulingMode = "priority" | "round-robin" | "random";

function getSchedulingMode(): SchedulingMode {
  const mode = getSettingOrDefault("ai_scheduling_mode");
  if (mode === "round-robin" || mode === "random") return mode;
  return "priority";
}

let _rrIndex = 0;

function scheduleProviders(list: AIProvider[], preferred?: string): AIProvider[] {
  const configured = list.filter((p) => p.isConfigured());
  if (configured.length === 0) return [];

  if (preferred) {
    const idx = configured.findIndex((p) => p.id === preferred);
    if (idx >= 0) {
      const removed = configured.splice(idx, 1);
      if (removed[0]) return [removed[0], ...configured];
    }
  }

  const mode = getSchedulingMode();

  if (mode === "round-robin") {
    const sorted = [...configured];
    const start = _rrIndex % sorted.length;
    const result: AIProvider[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[(start + i) % sorted.length];
      if (item) result.push(item);
    }
    _rrIndex = (_rrIndex + 1) % sorted.length;
    return result;
  }

  if (mode === "random") {
    const shuffled = [...configured];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      const swapWith = shuffled[j];
      if (tmp && swapWith) {
        shuffled[i] = swapWith;
        shuffled[j] = tmp;
      }
    }
    return shuffled;
  }

  return configured;
}

export async function generate(req: AIRequest): Promise<AIResponse> {
  const list = getOrderedProviders();
  const scheduled = scheduleProviders(list, req.preferred);

  let lastError: unknown = null;
  for (const p of scheduled) {
    try {
      return await p.generate(req);
    } catch (err) {
      console.warn(
        `[AI] ${p.name} (${p.id}) failed, trying next:`,
        (err as Error).message
      );
      lastError = err;
    }
  }
  throw new Error(
    `All AI providers failed: ${(lastError as Error)?.message ?? "unknown"}`
  );
}

export function getAvailableProviders(): AIProvider[] {
  return getOrderedProviders().filter((p) => p.isConfigured());
}

export function listAllKnownProviders(): Array<{
  id: string;
  name: string;
  configured: boolean;
  source: "db" | "env" | "mock";
}> {
  const list = getOrderedProviders();
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    configured: p.isConfigured(),
    source: p.id === "mock" ? "mock" : listEnabledAIProviders().find((r) => r.id === p.id) ? "db" : "env",
  }));
}

export async function testDBProvider(
  id: string
): Promise<{ ok: boolean; latencyMs: number; sample?: string; error?: string }> {
  const row = getAIProvider(id);
  if (!row) return { ok: false, latencyMs: 0, error: "not_found" };
  const p = providerFromRow({ ...row, enabled: 1 });
  if (!p.isConfigured()) {
    return { ok: false, latencyMs: 0, error: "not_configured" };
  }
  const start = Date.now();
  try {
    const resp = await p.generate({
      systemPrompt:
        "You are a helpful assistant. Respond briefly in the same language as the user prompt.",
      userPrompt: "Reply with the single word: ok",
      temperature: 0,
      maxTokens: 32,
    });
    return {
      ok: true,
      latencyMs: Date.now() - start,
      sample: resp.content.slice(0, 200),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: (err as Error).message.slice(0, 400),
    };
  }
}

export const ai = {
  generate,
  getAvailableProviders,
  listAllKnownProviders,
  testDBProvider,
};
