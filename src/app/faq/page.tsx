import { headers, cookies } from "next/headers";
import { Disclaimer } from "@/components/Disclaimer";
import { NavBar } from "@/components/NavBar";
import { resolveLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/config";

export const dynamic = "force-dynamic";

const FAQ = {
  en: {
    title: "Frequently Asked Questions",
    privacy: {
      heading: "Privacy & Data Protection",
      items: [
        {
          q: "Do you keep my personal birth details on your servers?",
          a: "No. We enforce a strict Zero-Knowledge Data Policy. Your birth timestamp is used exclusively in real-time memory to compute your energy spectrum. Once generated, all personal input vectors are automatically purged from our temporary servers within 24 hours.",
        },
        {
          q: "How long can I access my generated report online?",
          a: "Due to our privacy-first automatic cleanup system, live report links expire within 24 hours. We strongly recommend downloading or saving your report as a PDF immediately after viewing.",
        },
      ],
    },
    science: {
      heading: "Science, Philosophy & Concept",
      items: [
        {
          q: "How does a classical rhythm algorithm relate to modern energy cycles?",
          a: "Ancient environmental systems (such as classical Asian spatial literature like San Ming Tong Hui) mapped how human physiology and psychology interact with seasonal and temporal changes. We translate these intricate time-and-element relationships into modern energy cycle metrics, helping you understand when to push forward and when to rest.",
        },
        {
          q: "Can this report predict my exact future or make financial decisions for me?",
          a: "No. Future outcomes depend on individual choices, actions, and real-world conditions. Our reports do not predict fixed outcomes. Instead, they provide a 'weather forecast' for your personal energy levels, giving you environmental strategies (like spatial decor and mindfulness reflection) to navigate challenging phases smoothly.",
        },
      ],
    },
    purchase: {
      heading: "Purchases & Recommendations",
      items: [
        {
          q: "Are the recommended items (crystals, lamps, decor) mandatory to buy?",
          a: "Not at all. Product recommendations are optional tools designed to serve as visual and environmental 'anchors' in your home. You can achieve similar balancing effects simply by rearranging existing furniture, updating your room's color scheme, or adjusting lighting according to the report's layout guidance.",
        },
        {
          q: "What is your refund policy for digital books and premium reports?",
          a: "Because digital reports and downloadable PDF guides are instantly generated and delivered upon purchase, all sales of digital content are final. However, if you experience technical issues receiving your PDF, our support team will happily assist you in regenerating your document promptly.",
        },
      ],
    },
  },
  "zh-CN": {
    title: "常见问题",
    privacy: {
      heading: "隐私与数据",
      items: [
        {
          q: "你们会在服务器上保存我的出生信息吗？",
          a: "不会。我们实行严格的零知识数据政策。您的出生时间戳仅在实时内存中用于计算能量图谱。报告生成后，所有个人输入向量在 24 小时内自动从服务器清除。",
        },
        {
          q: "在线报告可以访问多久？",
          a: "由于我们的隐私优先自动清理系统，在线报告链接在 24 小时内失效。强烈建议在查看后立即下载或保存您的报告。",
        },
      ],
    },
    science: {
      heading: "理念与方法",
      items: [
        {
          q: "经典节律算法与现代能量周期有什么关系？",
          a: "古代环境系统（如经典东方空间文献如《三命通会》）记录了人类生理和心理如何与季节性和时间性变化互动。我们将这些复杂的时间与元素关系转化为现代能量周期指标，帮助你了解何时该前进、何时该休息。",
        },
        {
          q: "这个报告能预测我的确切未来或替我做财务决策吗？",
          a: "不能。未来结果取决于个人选择、行动和现实条件。我们的报告不预测固定结果，而是为你的个人能量水平提供「天气预报」，给你环境策略来平稳度过挑战期。",
        },
      ],
    },
    purchase: {
      heading: "购买与推荐",
      items: [
        {
          q: "推荐的商品（水晶、灯具、装饰品）是必须购买的吗？",
          a: "完全不需要。产品推荐是可选工具，旨在作为你家中的视觉和环境「锚点」。你只需重新布置现有家具、更新房间配色方案或按照报告的布局指导调整照明，即可达到类似的平衡效果。",
        },
        {
          q: "数字书籍和高级报告的退款政策是什么？",
          a: "由于数字报告和可下载 PDF 指南在购买后即时生成和交付，所有数字内容的销售均为最终销售。但如果你在接收 PDF 时遇到技术问题，我们的支持团队将乐意协助你重新生成文档。",
        },
      ],
    },
  },
} as const;

type FaqSection = { heading: string; items: ReadonlyArray<{ q: string; a: string }> };

export default async function FAQPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const al = (await headers()).get("accept-language");
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const { lang } = await searchParams;
  const locale = resolveLocale(al, cookieLang, lang, DEFAULT_LOCALE);
  const t = FAQ[locale];

  const sections: FaqSection[] = [t.privacy, t.science, t.purchase];

  return (
    <>
      <NavBar locale={locale} />
      <main className="container mx-auto min-h-screen px-5 py-8 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <Disclaimer variant="banner" locale={locale} />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t.title}
        </h1>

        {sections.map((section, si) => (
          <section key={si} className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              {section.heading}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, ii) => (
                <details
                  key={ii}
                  className="group rounded-xl border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 group-open:text-indigo-700 dark:text-zinc-300 dark:group-open:text-indigo-400">
                    {item.q}
                  </summary>
                  <p className="px-4 pb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <Disclaimer variant="compact" locale={locale} />
      </div>
    </main>
    </>
  );
}
