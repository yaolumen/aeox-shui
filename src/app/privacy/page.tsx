import { headers, cookies } from "next/headers";
import { NavBar } from "@/components/NavBar";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";

export const dynamic = "force-dynamic";

const T = {
  en: { title: "Privacy Policy", effective: "Effective: 2026-08-15" },
  "zh-CN": { title: "隐私政策", effective: "生效日期：2026-08-15" },
} as const;

const BODY = {
  en: [
    "This platform utilizes classical environmental algorithms and temporal philosophy to offer personal growth, interior aesthetic guidance, and mindfulness insights. We collect the minimum data needed to operate it.",
    "Data we process:",
    "- The birth date, hour, and gender you submit to generate your personal energy cycle analysis.",
    "- The IP address, for rate-limiting abuse (10 reports per hour per IP).",
    "- Anonymous usage events (page views, report generation) for traffic statistics.",
    "What we do NOT collect:",
    "- We do not require accounts, emails, or names.",
    "- We do not run advertising trackers, third-party analytics, or social pixels.",
    "- We do not sell or share your data with third parties.",
    "Zero-Knowledge Data Policy:",
    "Your birth details are held in temporary server memory only to render your analysis. All personal input vectors are automatically purged from our servers within 24 hours of report generation. We strongly recommend downloading or saving your report immediately after viewing, as report links expire after this period.",
    "Affiliates: when you click a recommended resource link, the destination site may set its own cookies under its own policy. Some product links are affiliate links — we may earn a small commission at no extra cost to you.",
    "AI providers: the birth details you submit are sent to our configured LLM to generate the analysis. Do not include personal information beyond what the form requires.",
    "California Consumer Privacy Act (CCPA):",
    "- We do not sell your personal information, nor do we share it for cross-context behavioral advertising purposes.",
    "- You have the right to know what personal information we collect, to request deletion, and to opt out of any sale. Since we do not sell data, there is nothing to opt out of.",
    "- To exercise any right, contact support@aeox.uk. We will respond within 45 days as required by law.",
    "EU / UK GDPR Privacy Notice:",
    "- Data Controller: YAOLUMEN TECHNOLOGIES LTD (operating as AEOX / Shui). Contact: support@aeox.uk.",
    "- Legal Basis for Processing: Processing of temporal inputs is based on your explicit consent (Art. 6(1)(a) GDPR) provided upon submitting the form.",
    "- Your Rights: Under GDPR and UK DPA 2018, you have the right to access, rectify, or request immediate erasure of your data. However, as our system enforces a Zero-Knowledge Architecture where personal inputs are automatically purged from temporary memory within 24 hours, we do not maintain persistent personal records to modify or retrieve after expiration.",
    "Contact: support@aeox.uk",
  ],
  "zh-CN": [
    "本平台运用经典环境算法与传统节律哲学，提供个人成长、室内美学指导与正念参考。我们仅收集运营所必需的最少数据。",
    "我们处理的数据：",
    "- 你提交的出生日期、时辰和性别，用于生成个人能量周期分析。",
    "- IP 地址，用于限流防滥用（每个 IP 每小时 10 次）。",
    "- 匿名使用事件（页面访问、报告生成），用于流量统计。",
    "我们**不**收集：",
    "- 不需要账户、邮箱或姓名。",
    "- 不使用广告追踪、第三方分析或社交像素。",
    "- 不向第三方出售或分享你的数据。",
    "零知识数据政策：",
    "您的出生信息仅在实时内存中用于计算能量图谱。所有个人输入向量在报告生成后 24 小时内自动从服务器清除。请及时下载或保存您的报告，报告链接在此期限后失效。",
    "联盟推广：当你点击推荐资源链接时，目标网站可能根据其自身政策设置 cookie。部分产品链接为联盟营销链接——购买后我们可能获得小额佣金，不增加您的费用。",
    "AI 服务：你提交的出生信息会发送到我们配置的 LLM 用于生成分析。请勿在表单中包含超出需要的个人信息。",
    "加州消费者隐私法（CCPA）：",
    "- 我们不出售您的个人信息，也不为跨上下文行为广告目的分享您的信息。",
    "- 您有权了解我们收集了哪些个人信息、要求删除，以及选择退出任何出售。由于我们不出售数据，无需额外操作。",
    "- 如需行使任何权利，请联系 support@aeox.uk。我们将在法律要求的 45 天内回复。",
    "欧盟/英国 GDPR 隐私声明：",
    "- 数据控制者：YAOLUMEN TECHNOLOGIES LTD（以 AEOX / Shui 名义运营）。联系：support@aeox.uk。",
    "- 处理的法律依据：对时间输入的处理基于您提交表单时提供的明确同意（GDPR 第 6(1)(a) 条）。",
    "- 您的权利：根据 GDPR 和英国 DPA 2018，您有权访问、更正或要求立即删除您的数据。但由于我们的系统实行零知识架构，个人输入在 24 小时内自动从临时内存中清除，我们不会在到期后保留可供修改或检索的持久个人记录。",
    "联系：support@aeox.uk",
  ],
} as const;

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE);
  const t = T[locale];
  const body = BODY[locale];

  return (
    <>
      <NavBar locale={locale} />
      <main className="container mx-auto min-h-screen px-5 py-8 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.effective}</p>
        {body.map((line, i) => (
          <p
            key={i}
            className="leading-relaxed text-zinc-700 dark:text-zinc-300"
          >
            {line}
          </p>
        ))}
      </div>
    </main>
    </>
  );
}
