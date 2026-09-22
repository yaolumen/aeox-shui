# Shui PDF Report Design Specification

## Current Architecture

- **Engine**: Client-side html2pdf.js (replaced server-side puppeteer-core / @react-pdf/renderer / pdfkit)
- **Font**: Noto Sans SC via CDN `@import` + system fallbacks (SimHei, Microsoft YaHei)
- **Output**: A4 PDF, generated in browser via html2pdf.js (html2canvas + jsPDF)
- **Theme**: 4 palettes (indigo/dark/warm/glass), configured via admin Style tab (`style_preset` setting)
- **Icon**: 2 options (wuxing pentagram / moon phase), configured via admin Style tab (`style_icon` setting)
- **Layout**: 1-column or 2-column, configured via admin Style tab (`style_columns` setting)
- **Preview**: Server renders HTML at `/api/v1/report/[id]/preview?theme=&icon=&columns=`

## Page Structure

### Page 1: Cover

| Element | Style |
|---------|-------|
| Top bar | 6px full-width, --cover-bar color |
| SVG icon | 160px circle, wuxing pentagram or moon phase |
| Brand | 36px bold, --brand color, letter-spacing 6px, centered |
| Subtitle | 13px, --muted color, letter-spacing 2px, centered |
| Title | 24px bold, --title color, letter-spacing 2px, centered |
| Premium badge | 12px, --premium color, border + pill shape |
| Bazi string | 11px, --muted, letter-spacing 3px, centered, joined by `·` |
| Report ID + date | 10px, --muted, centered |
| AI provider/model | 10px, --muted, centered |
| Footer divider | 1px, --divider |
| Copyright | 8px, --muted, centered |

### Page 2: Analysis

| Element | Style |
|---------|-------|
| Section title | 16px bold, --brand, with --muted English subtitle |
| Bazi pillars | 4-column grid, 20px bold, --pillar-bg rounded rect |
| Wuxing bars | Label (70px) + bar (flex, height 12px) + percentage (40px) |
| Core section | 2×2 grid, --paper bg, rounded border |

### Pages 3+: Content (CSS Multi-Column)

**Layout**: `column-count: var(--content-columns, 2)` with `column-rule: 1px solid var(--divider)`

| Element | Style |
|---------|-------|
| H1 (`# `) | 14px bold, --brand, border-bottom, break-after: avoid |
| H2 (`## `) | 12px bold, --brand, break-after: avoid |
| H3 (`### `) | 11px bold, --brand, break-after: avoid |
| Paragraph | 9px, --text, line-height 1.7, text-align: justify |
| Bullet (`- ` / `* `) | 9px, `•` prefix via ::before, break-inside: avoid |
| Ordered (`1. `) | `<ol>` with counters, --brand color numbers |
| Inline bold (`**...**`) | `<strong>`, --title color |
| Inline italic (`*...*`) | `<em>` |
| Inline code (`` `...` ``) | `<code>`, monospace, --bar-bg background |
| HR (`---`) | 1px, --divider |

**No manual split**: CSS `column-count` handles automatic flow — headings stay with their content via `break-after: avoid`.

### Last Page: Disclaimer

| Element | Style |
|---------|-------|
| Watermark | 80px bold, --brand, opacity 0.12 |
| End title | 18px bold, --title, letter-spacing 4px |
| Divider | 1px, --divider, margin 40px 0 20px |
| Disclaimer text | 10px, --muted, line-height 1.7 |
| Copyright | 8px, --muted, centered |

## Theme Palettes

### Indigo (default)
```css
--cover-bg: #F5F3FF; --cover-bar: #4F46E5; --brand: #4F46E5;
--title: #1F2937; --text: #374151; --muted: #6B7280;
--bg: #F9FAFB; --paper: #FFFFFF; --border: #E5E7EB;
--bar-bg: #F3F4F6; --divider: #E5E7EB; --pillar-bg: #EEF2FF;
--premium: #D97706;
/* body-bg: #FFFFFF */
```

### Dark
```css
--cover-bg: #0F0F11; --cover-bar: #818CF8; --brand: #A5B4FC;
--title: #E0E7FF; --text: #E0E7FF; --muted: rgba(224,231,255,0.6);
--bg: #1E1B4B; --paper: #1A1744; --border: #3730A3;
--bar-bg: #312E81; --divider: rgba(255,255,255,0.15); --pillar-bg: #312E81;
--premium: #FCD34D;
/* body-bg: #1E1B4B */
```

### Warm
```css
--cover-bg: #1C1917; --cover-bar: #F59E0B; --brand: #FDE68A;
--title: #FDE68A; --text: #FDE68A; --muted: rgba(253,230,138,0.6);
--bg: #292524; --paper: #231F1D; --border: #D97706;
--bar-bg: #78350F; --divider: rgba(255,255,255,0.12); --pillar-bg: #3F2A1A;
--premium: #FBBF24;
/* body-bg: #292524 */
```

### Glass (gradient + transparency)
```css
--cover-bg: linear-gradient(135deg, #667EEA, #764BA2); --cover-bar: #FFFFFF; --brand: #FFFFFF;
--title: #FFFFFF; --text: #FFFFFF; --muted: rgba(255,255,255,0.75);
--bg: rgba(255,255,255,0.06); --paper: rgba(255,255,255,0.10);
--border: rgba(255,255,255,0.25); --bar-bg: rgba(255,255,255,0.12);
--divider: rgba(255,255,255,0.2); --pillar-bg: rgba(255,255,255,0.10);
--premium: #FDE68A;
/* body-bg: linear-gradient(135deg, #667EEA, #764BA2); background-attachment: fixed */
/* cover-bg-solid: #764BA2 (for SVG moon cutout) */
```

## Wuxing Bar Colors

| Element | Color |
|---------|-------|
| Wood | #10B981 |
| Fire | #EF4444 |
| Earth | #F59E0B |
| Metal | #6B7280 |
| Water | #3B82F6 |

Bar width = `(value / sum) * 100%` — proportional to total, not relative to max.

## i18n Labels (EN / ZH)

| Key | EN | ZH |
|-----|----|----|
| brand | Shui | 水 · 节律 |
| subtitle | Decode Your Personal Energy Cycle | 解码你的个人能量周期 |
| reportTitle | Personal Energy Cycle Report | 个人能量周期报告 |
| premiumTitle | In-Depth Energy Profile | 深度能量节律图谱 |
| reportId | Report ID | 报告编号 |
| bazi | Temporal Energy Vector | 时间能量向量 |
| wuxing | Elemental Balance | 五行平衡 |
| dayMaster | Core Element | 核心元素 |
| strength | Energy Level | 能量水平 |
| favorable | Energy Catalysts | 能量催化剂 |
| unfavorable | Elements to Observe | 需关注元素 |
| aiMeta | Generated by | 生成方 |
| classic | Classic | 典籍 |
| disclaimer | AI-generated content notice... | AI 生成内容声明... |
| inDepth | In-Depth | 深度版 |

## Font Strategy

- **Primary**: Noto Sans SC via `@import` from jsDelivr CDN (requires internet on client)
- **Fallbacks**: SimHei, Microsoft YaHei, system sans-serif
- **Print**: `-webkit-print-color-adjust: exact; print-color-adjust: exact;` to preserve theme colors

## Layout: Screen Preview

- **body**: `display: flex; flex-direction: column; align-items: center;` — pages centered on screen
- **.page**: `width: 210mm; min-height: 297mm; box-shadow: 0 2px 16px rgba(0,0,0,0.12);` — A4 card with shadow
- **@media print**: `body { display: block; } .page { box-shadow: none; }` — clean PDF output

## Key Design Decisions

1. **Client-side PDF via html2pdf.js**: Server-side PDF generation (puppeteer/wkhtmltopdf) not viable on Hostinger shared hosting. html2pdf.js runs entirely in browser, no server deps needed.

2. **HTML template approach**: `buildHtml()` generates a complete HTML document with CSS custom properties for theming. Full CSS support — gradients, transparency, multi-column, SVG — far beyond what @react-pdf/renderer or pdfkit could achieve.

3. **CSS multi-column layout**: `column-count: var(--content-columns)` with `break-after: avoid` on headings. Browser handles column flow naturally — no manual block splitting needed. User can choose 1-column or 2-column.

4. **Glass theme with gradient body**: `body` background is a fixed gradient; `.page` uses `rgba()` transparency so the gradient shows through. `--cover-bg` set to the same gradient via inline style.

5. **Theme + icon + columns user-selectable**: PdfDownloadModal offers 4 themes × 2 icons × 2 column layouts. Admin default from `getStylePreset()` which reads `style_preset`, `style_icon`, `style_columns`, `style_card_layout` settings independently.

6. **No recommendations in PDF**: Affiliate URLs are non-clickable in PDF; recommendations section removed from PDF output.

7. **Fetch + DOM injection for PDF download**: PdfDownloadModal fetches preview HTML via `fetch()`, injects into offscreen container, then runs html2pdf.js on the DOM node. Avoids iframe cross-origin issues.

## File Locations

| File | Purpose |
|------|---------|
| `src/lib/pdf/generate.ts` | `buildHtml(data)` → HTML string with theme/icon/columns |
| `src/app/api/v1/report/[id]/preview/route.ts` | Serves styled HTML for preview & PDF generation |
| `src/app/api/v1/report/[id]/pdf/route.ts` | Redirects to preview route |
| `src/components/PdfDownloadModal.tsx` | Theme/icon/columns selector + html2pdf.js download |
| `src/components/ShareCardModal.tsx` | Auto-generate card image on open, share via native share / clipboard |
| `src/components/admin/StyleTab.tsx` | Visual style preset manager (theme, icon, columns, card layout + live previews) |
| `src/components/ReportView.tsx` | PDF/Share buttons open modals with `style` prop from `getStylePreset()` |
| `src/lib/settings.ts` | `StylePreset` type + `getStylePreset()` — reads 4 independent settings fields |
| `next.config.mjs` | `serverComponentsExternalPackages: ["better-sqlite3"]` |

## Migration History

### pdfkit → @react-pdf/renderer
- pdfkit v0.19 ToUnicode CMap bug: single `beginbfrange` with incomplete CID coverage → □ (tofu) for CJK on multi-page PDFs
- Switched to @react-pdf/renderer for correct CIDFont + ToUnicode CMap

### @react-pdf/renderer → HTML template
- @react-pdf/renderer limited CSS support, couldn't match HTML demo quality
- Switched to HTML template with full CSS support

### Server-side → Client-side PDF
- puppeteer-core requires Chromium binary (~300MB) — not available on Hostinger shared hosting
- Switched to html2pdf.js (client-side, bundles html2canvas + jsPDF)

### v0.12.0 — De-AI compliance pass
- Disclaimer text: "AI-generated" → "Generated by Shui Chronobiological Algorithmic Engine based on classical temporal logic and environmental harmony principles"
- `aiMeta` label: "Generated by" → "Powered by Shui Algorithmic Engine" / "由水·节律算法引擎驱动"
- Removed provider/model from PDF footer (replaced with engine branding)
- Style settings now granular: `style_preset` + `style_icon` + `style_columns` + `style_card_layout`
- `generatePdf()` removed, replaced by `buildHtml()` returning HTML string
- `/api/v1/report/[id]/pdf` route now redirects to `/api/v1/report/[id]/preview`
- `puppeteer-core` removed from `serverComponentsExternalPackages` in `next.config.mjs`
- `puppeteer-core` and `@react-pdf/renderer` uninstalled from `package.json`
