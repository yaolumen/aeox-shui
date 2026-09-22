/**
 * Admin: bulk seed DB providers from env templates
 * POST /api/v1/admin/ai-providers/seed
 * Only inserts when DB is empty; useful to bootstrap from .env keys.
 */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { countAIProviders, upsertAIProvider, type AIProviderRow } from "@/lib/db";
import { invalidateProviderCache } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES: Array<{
  id: string;
  name: string;
  envKey: string;
  envUrl: string;
  defaultUrl: string;
  envModel: string;
  defaultModel: string;
  note: string;
}> = [
  {
    id: "agnes-ai",
    name: "Agnes AI Flash",
    envKey: "AGNES_AI_API_KEY",
    envUrl: "AGNES_AI_BASE_URL",
    defaultUrl: "https://apihub.agnes-ai.com/v1",
    envModel: "AGNES_AI_MODEL",
    defaultModel: "agnes-2.0-flash",
    note: "Agnes AI 全模态 API，OpenAI 兼容",
  },
  {
    id: "unorouter",
    name: "UnoRouter Free",
    envKey: "UNOROUTER_API_KEY",
    envUrl: "UNOROUTER_BASE_URL",
    defaultUrl: "https://api.unorouter.com/v1",
    envModel: "UNOROUTER_MODEL",
    defaultModel: "gpt-oss-120b:free",
    note: "UnoRouter 统一网关，200+ 模型，免费 tier 可用",
  },
  {
    id: "zhipu",
    name: "智谱 GLM-4-Flash",
    envKey: "ZHIPU_API_KEY",
    envUrl: "ZHIPU_BASE_URL",
    defaultUrl: "https://open.bigmodel.cn/api/paas/v4",
    envModel: "ZHIPU_MODEL",
    defaultModel: "glm-4-flash",
    note: "中文友好，免费 tier 适合个人项目",
  },
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM (Llama)",
    envKey: "NVIDIA_NIM_API_KEY",
    envUrl: "NVIDIA_NIM_BASE_URL",
    defaultUrl: "https://integrate.api.nvidia.com/v1",
    envModel: "NVIDIA_NIM_MODEL",
    defaultModel: "meta/llama-3.1-8b-instruct",
    note: "英伟达免费 100 年活动，需 nvapi- 前缀",
  },
];

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  if (countAIProviders() > 0) {
    return NextResponse.json({ ok: false, error: "already_seeded" }, { status: 409 });
  }
  const now = Date.now();
  let inserted = 0;
  TEMPLATES.forEach((t, i) => {
    const key = process.env[t.envKey];
    if (!key) return;
    const baseUrl = process.env[t.envUrl] ?? t.defaultUrl;
    const model = process.env[t.envModel] ?? t.defaultModel;
    const row: AIProviderRow = {
      id: t.id,
      name: t.name,
      base_url: baseUrl,
      model,
      api_key: key,
      role: "report",
      enabled: 1,
      sort_order: i,
      note: t.note,
      created_at: now,
      updated_at: now,
    };
    upsertAIProvider(row);
    inserted += 1;
  });
  invalidateProviderCache();
  return NextResponse.json({ ok: true, inserted });
}
