import { generalConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const base = generalConfig.brand.domain
    ? `https://${generalConfig.brand.domain}`
    : "http://localhost:3000";
  const now = new Date().toISOString();
  const urls: Array<{ loc: string; changefreq: string; priority: number }> = [
    { loc: `${base}/`, changefreq: "weekly", priority: 1.0 },
    { loc: `${base}/analyze`, changefreq: "monthly", priority: 0.9 },
    { loc: `${base}/cases`, changefreq: "monthly", priority: 0.5 },
    { loc: `${base}/about`, changefreq: "monthly", priority: 0.4 },
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
