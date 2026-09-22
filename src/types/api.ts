import { z } from "zod";

export const LoginBodySchema = z.object({
  name: z.string().optional(),
  password: z.string().optional(),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;

export const ReportBodySchema = z.object({
  birthDate: z.string().min(1),
  hour: z.number().int().min(0).max(23),
  gender: z.enum(["male", "female", "other"]),
  locale: z.enum(["en", "zh-CN"]).optional(),
  template: z.string().optional(),
  fateBook: z.string().optional(),
  tier: z.enum(["free", "premium"]).optional(),
  creditCode: z.string().optional(),
  cycleId: z.string().optional(),
  cycleYears: z.number().int().positive().optional(),
});
export type ReportBody = z.infer<typeof ReportBodySchema>;

export const AIProviderCreateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().min(6),
  role: z.enum(["primary", "fallback"]).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  note: z.string().nullable().optional(),
});
export type AIProviderCreate = z.infer<typeof AIProviderCreateSchema>;

export const AIProviderPatchSchema = z.object({
  name: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  role: z.string().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  note: z.string().nullable().optional(),
});export type AIProviderPatch = z.infer<typeof AIProviderPatchSchema>;

export const ProductCreateSchema = z.object({
  id: z.string().min(1),
  titleEn: z.string().optional(),
  titleZh: z.string().optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionZh: z.string().nullable().optional(),
  category: z.string().min(1),
  productType: z.string().optional(),
  url: z.string().min(1),
  price: z.string().nullable().optional(),
  deliveryInfo: z.record(z.string(), z.string()).nullable().optional(),
  tags: z.array(z.string()).optional(),
  wuxing: z.array(z.string()).optional(),
  locales: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type ProductCreate = z.infer<typeof ProductCreateSchema>;

export const SettingsUpdateSchema = z.record(z.string(), z.string());
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

export const CycleCreateSchema = z.object({
  id: z.string().min(1),
  name_en: z.string().min(1),
  name_zh: z.string().min(1),
  years: z.number().int().positive(),
  enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
export type CycleCreate = z.infer<typeof CycleCreateSchema>;

export const OrderCreateSchema = z.object({
  id: z.string().optional(),
  reportId: z.string().nullable().optional(),
  productId: z.string(),
  productType: z.string(),
  buyerEmail: z.string().nullable().optional(),
  buyerIp: z.string().nullable().optional(),
  amount: z.string().nullable().optional(),
  status: z.string().optional(),
  trackingNo: z.string().nullable().optional(),
  deliveryNote: z.string().nullable().optional(),
  paidAt: z.number().nullable().optional(),
  deliveredAt: z.number().nullable().optional(),
});
export type OrderCreate = z.infer<typeof OrderCreateSchema>;

export const OrderPatchSchema = z.object({
  status: z.string().optional(),
  trackingNo: z.string().nullable().optional(),
  deliveryNote: z.string().nullable().optional(),
  buyerEmail: z.string().nullable().optional(),
});
export type OrderPatch = z.infer<typeof OrderPatchSchema>;

export const AdminPatchSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  enabled: z.boolean().optional(),
  password: z.string().min(6).optional(),
});
export type AdminPatch = z.infer<typeof AdminPatchSchema>;

export const GenericObjectSchema = z.record(z.string(), z.unknown());
export type GenericObject = z.infer<typeof GenericObjectSchema>;

export const StripeSessionSchema = z.object({
  id: z.string(),
  url: z.string(),
});
export type StripeSession = z.infer<typeof StripeSessionSchema>;

export const PayPalTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
});
export type PayPalToken = z.infer<typeof PayPalTokenSchema>;

export const PayPalOrderSchema = z.object({
  id: z.string(),
  links: z.array(z.object({ rel: z.string(), href: z.string() })),
});
export type PayPalOrder = z.infer<typeof PayPalOrderSchema>;

export const StripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      metadata: z.object({ report_id: z.string().optional() }).optional(),
      id: z.string().optional(),
    }),
  }),
});
export type StripeWebhook = z.infer<typeof StripeWebhookSchema>;

export const PayPalCaptureSchema = z.object({
  status: z.string(),
  purchase_units: z.array(z.object({ reference_id: z.string().optional() })).optional(),
});
export type PayPalCapture = z.infer<typeof PayPalCaptureSchema>;

export const OpenAIResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string() }),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});
export type OpenAIResponse = z.infer<typeof OpenAIResponseSchema>;
