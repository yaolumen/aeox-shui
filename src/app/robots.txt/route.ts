import { generalConfig, seoConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const lines: string[] = [];
  lines.push("User-agent: *");
  if (seoConfig.robots.allowAll) {
    lines.push("Allow: /");
  }
  for (const p of seoConfig.robots.disallowPaths ?? []) {
    lines.push(`Disallow: ${p}`);
  }
  if (seoConfig.robots.sitemap) {
    const base = generalConfig.brand.domain
      ? `https://${generalConfig.brand.domain}`
      : "http://localhost:3000";
    lines.push(`Sitemap: ${base}${seoConfig.robots.sitemap}`);
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
