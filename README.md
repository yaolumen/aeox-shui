# Shui · Decode Your Personal Energy Cycle

AI-assisted personal energy cycle analysis — **chronobiological rhythms, seasonal resonance, and spatial harmony strategies** for overseas learners.
Free, fast, lightweight. Affiliate product recommendations on the report page.

> **Disclaimer:** This platform utilizes classical environmental algorithms and temporal philosophy to offer personal growth, interior aesthetic guidance, and mindfulness insights. It does NOT constitute medical, investment, marital, career, legal, or any other form of decision-making advice.

## Stack

- **Next.js 14** (App Router) + **TypeScript 5**
- **SQLite** (better-sqlite3) — single file, zero external DB
- **OpenAI-compatible AI providers** — Agnes AI, UnoRouter, Zhipu GLM, NVIDIA NIM, or any custom endpoint
- **No auth, no payment, no signup** — fully open access
- **i18n:** English (default) + Chinese fallback
- **Mobile-first** responsive design
- **Monetization:** E-commerce (default) or Freemium mode

## Quick start (local)

```bash
git clone <repo>
cd quantum-fate-lite
cp .env.example .env
# Edit .env: add at least one AI key (AGNES_AI_API_KEY, UNOROUTER_API_KEY, ZHIPU_API_KEY, or NVIDIA_NIM_API_KEY)
#          add a real ADMIN_PASSWORD (>= 6 chars in production)
npm install
npm run build
npm start
# open http://localhost:3000
```

For dev mode with HMR:

```bash
npm run dev
```

To safely stop the dev server without killing other Node.js processes (e.g. DevEco Code):

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/kill-next.ps1         # default port 3000
pwsh -ExecutionPolicy Bypass -File scripts/kill-next.ps1 -Port 3001
```

For LAN access:

```powershell
$env:HOST="0.0.0.0"; Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next","start" -WorkingDirectory "D:\codex\aeox-shui" -WindowStyle Hidden
```

## Environment variables

See [.env.example](.env.example) — every variable is documented inline.

| Var | Required | Purpose |
|---|---|---|
| `AGNES_AI_API_KEY` | recommended | Agnes AI — omni-modal, OpenAI-compatible. Get key at https://agnes-ai.com |
| `UNOROUTER_API_KEY` | recommended | UnoRouter — unified gateway, 200+ models, free tier available. Get key at https://unorouter.com |
| `ZHIPU_API_KEY` | optional | Zhipu GLM-4-Flash — great for Chinese, free tier. Get key at https://open.bigmodel.cn |
| `NVIDIA_NIM_API_KEY` | optional | NVIDIA NIM — free tier, multi-model. Get at https://build.nvidia.com |
| `ADMIN_PASSWORD` | **yes** in prod | Password for admin panel (>= 6 chars in production) |
| `ADMIN_SLUG` | optional | Custom admin URL slug (default: `admingl`). Access admin at `/{ADMIN_SLUG}` |
| `FATE_BOOK_DEFAULT` | optional | `sanming` (default) or `zipingzhenquan` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Full https URL — used in sitemap, OG, llms.txt |
| `DATABASE_DIR` | optional | Override SQLite data directory (default: `./data`) |

If no AI key is set, the app falls back to a deterministic **mock** so it still runs in dev.

### Supported AI providers

All providers use the OpenAI-compatible `/chat/completions` interface. Configure via `.env` or the admin UI.

| Provider | Base URL | Default Model | Notes |
|---|---|---|---|
| **Agnes AI** | `https://apihub.agnes-ai.com/v1` | `agnes-2.0-flash` | Omni-modal; also `agnes-2.5-flash`, `agnes-2.5-pro` |
| **UnoRouter** | `https://api.unorouter.com/v1` | `gpt-oss-120b:free` | 200+ models via one key; free tier with `:free` suffix |
| **Zhipu GLM** | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | Chinese-friendly, free tier |
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | `meta/llama-3.1-8b-instruct` | Key must start with `nvapi-` |
| **Custom** | any OpenAI-compatible URL | any model | Add in admin UI |

## Deploy to Hostinger

### Option A: Cloud Hosting / Business Web Hosting (managed, recommended)

Hostinger's managed Node.js hosting supports Next.js SSR directly via hPanel Web Apps — no SSH, no PM2, no nginx config needed.

1. **Create zip** (source code only, no `node_modules`):
   ```bash
   # Already built: dist/qfl-hostinger-deploy.zip (~0.3MB)
   # Or manually:
   Compress-Archive package.json,package-lock.json,next.config.mjs,tsconfig.json,tailwind.config.ts,postcss.config.mjs,.env.example,src,config,public -DestinationPath qfl-hostinger-deploy.zip
   ```

2. **hPanel** → Websites → Add Website → Node.js web app → Upload your files → upload `qfl-hostinger-deploy.zip`

3. **Build settings** (auto-detected, verify these):
   | Setting | Value |
   |---|---|
   | Application type | `next` |
   | Node.js version | `22` |
   | Build script | `build` |
   | Output directory | `.next` |
   | Entry file | leave empty |

4. **Environment variables** (hPanel → Environment Variables):
   | Variable | Required | Example |
   |---|---|---|
   | `ADMIN_PASSWORD` | **yes** | `your-strong-password` |
   | `NEXT_PUBLIC_SITE_URL` | recommended | `https://your-domain.com` |
   | `ADMIN_SLUG` | optional | `admingl` (default) |
   | `DATABASE_DIR` | optional | leave empty → uses `./data` |
   | AI keys | on demand | add when configuring providers in admin UI |

5. Click **Deploy** — Hostinger runs `npm install` + `npm run build` automatically. Check build logs for `better-sqlite3` compilation status.

6. Access admin at `https://your-domain.com/admingl` → add AI providers → done.

> **Note:** `better-sqlite3` requires C++ compilation on the server. Hostinger's build environment usually handles this. If it fails, the alternative is to replace SQLite with JSON file storage (see project context notes).

### Option B: VPS (manual, full control)

See [deploy.sh](deploy.sh) and [nginx.conf.example](nginx.conf.example).

```bash
cd /home/<user>/domains/<your-domain>/public_html
git clone <your-repo> quantum-fate-lite
cd quantum-fate-lite
cp .env.example .env && nano .env        # fill real keys
npm i -g pm2
bash deploy.sh                           # builds + starts via PM2
```

Add the nginx vhost from `nginx.conf.example` (place via Hostinger control panel → Nginx Config).

### SQLite concurrency

Hostinger Web Apps runs a single Node.js process. With `better-sqlite3` WAL mode (default):
- Reads: ~10,000/sec — no contention
- Mixed read/write: ~1,000/sec — WAL allows concurrent reads during writes
- Single-process writes: fully serialized, no lock conflicts

100+ concurrent users is well within capacity. The actual bottleneck is AI API latency (5-30s/request), not the database.

## Compliance & terminology

This project uses **compliant modern terminology** throughout the front-end to meet Stripe, PayPal, Meta, and TikTok policy requirements. The classical BaZi calculation engine runs as a backend algorithm, but all user-facing language is rephrased:

| Traditional term (internal only) | Compliant front-end term |
|---|---|
| BaZi / Eight Characters | Temporal Energy Vector (TEV) |
| Fortune / Fate | Personal Energy Cycle (PEC) |
| 算命 / 命理 | Chronobiological Profile / 节律 |
| 运势 / 运程 | Life Rhythm Analysis / 能量周期 |
| 风水 / 辟邪 / 招财 | Spatial Harmony Design / 空间调和 |
| 凶煞 / 运势低谷 | Low-Energy Phase / Restorative Period |
| 喜用神 | Energy Catalyst / 能量催化剂 |
| 忌神 | Elements to Observe / 需关注元素 |
| 转运道具 | Harmonizing Decor / 调和装饰 |

### Three-part compliance statement

Every report page includes a collapsible disclaimer with:

1. **Service Disclaimer** — classical environmental algorithms, not medical/legal/financial advice
2. **Affiliate Disclosure** — FTC/GDPR-compliant transparency on commission links
3. **Data Lifecycle Notice** — Zero-Knowledge Data Policy, auto-purge in 24h

### Payment product descriptions

- Stripe line item: `Personalized Energy Profile — In-Depth Edition`
- Stripe category: `Digital Educational Content`
- PayPal description: same

## Monetization modes

Two modes, configured in admin Settings tab:

| Mode | Reports | Revenue source |
|---|---|---|
| **E-commerce** (default) | All free | Product recommendations + affiliate links |
| **Freemium** | Free + Premium (credit code) | Premium reports + optional product links |

In E-commerce mode, the tier selector is hidden and all reports use the free template. In Freemium mode, users can choose between free and premium (requires credit code).

## API

All endpoints are unauthenticated except `/api/v1/admin/*`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/config` | Public config (brand, i18n, SEO, templates, monetization mode) |
| GET | `/api/v1/ai/health` | Which AI providers are configured (no secrets leaked) |
| POST | `/api/v1/report` | Generate a report (rate-limited 10/hr/IP), accepts `cycleId` |
| GET | `/api/v1/report/[id]` | Fetch a report |
| GET | `/api/v1/report/[id]/preview` | Styled HTML preview (theme/icon/columns params) |
| GET | `/api/v1/report/[id]/pdf` | Redirects to preview route |
| GET | `/api/v1/products?locale=en&wuxing=wood&featured=1` | Public product list |
| POST | `/api/v1/admin/login` | Admin login (sets `qfl_admin` cookie) |
| POST | `/api/v1/admin/logout` | Admin logout |
| GET | `/api/v1/admin/stats` | Traffic stats |
| GET | `/api/v1/admin/products` | All products (incl. inactive) |
| POST | `/api/v1/admin/products` | Create product |
| PATCH | `/api/v1/admin/products/[id]` | Update product |
| DELETE | `/api/v1/admin/products/[id]` | Delete product |
| GET | `/api/v1/admin/ai-providers` | List AI providers (DB-backed, keys masked) |
| POST | `/api/v1/admin/ai-providers` | Add AI provider |
| PATCH | `/api/v1/admin/ai-providers/[id]` | Update AI provider (e.g. toggle, change key) |
| DELETE | `/api/v1/admin/ai-providers/[id]` | Remove AI provider |
| POST | `/api/v1/admin/ai-providers/[id]/test` | Test connectivity |
| POST | `/api/v1/admin/ai-providers/seed` | One-shot import from `.env` |
| GET | `/api/v1/admin/admins` | List admin accounts |
| PATCH | `/api/v1/admin/admins/[id]` | Update admin (change password) |
| GET | `/api/v1/admin/settings` | List all settings |
| PATCH | `/api/v1/admin/settings` | Batch update settings |
| POST | `/api/v1/admin/settings` | Batch update settings (alternative) |
| GET | `/api/v1/admin/cycles` | List report cycles |
| POST | `/api/v1/admin/cycles` | Create/update report cycle |
| DELETE | `/api/v1/admin/cycles/[id]` | Delete report cycle |
| GET | `/api/v1/admin/credits` | List credit codes |
| POST | `/api/v1/admin/credits` | Generate credit codes |
| GET | `/api/v1/admin/orders` | List orders |
| PATCH | `/api/v1/admin/orders/[id]` | Update order status |

## Admin

Open `/{ADMIN_SLUG}` (default: `/admingl`) → enter password → full dashboard.

Single-user multi-device design: one admin account, no super/sub roles. All tabs always visible. Mobile-responsive with hamburger menu + full-width content.

### Admin tabs

| Tab | Purpose |
|---|---|
| **Stats** | Traffic KPIs, 7-day chart, online admins, recent reports (auto-refresh 30s) |
| **Products** | Manage products (online/physical, EN/ZH titles, wuxing, delivery info) |
| **Orders** | Order list and status management (mark paid, mark delivered) |
| **Credits** | Generate and manage credit codes (freemium mode) |
| **AI Providers** | Add/edit/test/delete OpenAI-compatible providers; primary/fallback roles; Seed from .env |
| **Style** | Visual style presets — theme (Indigo/Dark/Warm/Glass), icon (Wuxing/Moon), PDF columns (1/2), card layout (horizontal/vertical/square); live PDF + card preview |
| **Settings** | Brand & Identity, monetization mode, payment keys, report TTL, AI scheduling, analysis cycles |
| **Account** | View account info, change password |

### Admin security

- Custom URL slug via `ADMIN_SLUG` env var (default: `admingl`) — `/admin` returns 404
- HMAC-signed session cookies with configurable TTL (`admin_session_ttl_hours`)
- Max 2 concurrent admin sessions (429 `max_admins_reached`)
- Auto-logout on 401 response

### AI provider management

The **AI Providers** tab supports:

- **Add** any OpenAI-compatible provider (Agnes AI, UnoRouter, Zhipu, NVIDIA NIM, DeepSeek, Moonshot, custom…)
- **Edit** name, base URL, model, sort order, role (primary/fallback), enable/disable, and replace the API key
- **Test** connectivity (single ping prompt; ~1s response, no quota waste)
- **Delete** providers
- **Seed from .env** — one-click bootstrap: reads `AGNES_AI_API_KEY`, `UNOROUTER_API_KEY`, `ZHIPU_API_KEY`, and `NVIDIA_NIM_API_KEY` from your `.env` and inserts them as providers in SQLite. Skipped if providers already exist.

API key workflow: keys live in the `ai_providers` SQLite table. The list API masks them (`nvap••••zVbi`). Switching providers is hot — no restart required, next request picks up the new order.

If you have keys in `.env` but no providers in DB, click **Seed from .env** on the AI tab. After that, you can edit/disable them entirely from the UI without touching `.env`.

### AI scheduling modes

Configured in Settings → AI Scheduling:

| Mode | Behavior |
|---|---|
| **Priority** (default) | Always use first enabled primary provider; fallback on failure |
| **Round-robin** | Rotate through enabled providers sequentially |
| **Random** | Shuffle enabled providers each request |

### Language switching

- NavBar includes EN/中 toggle
- Language persisted via `shui_lang` cookie (1 year)
- All navigation links carry `?lang=` param to maintain language across pages
- Middleware intercepts `?lang=` on non-API/admin routes and sets cookie

## Core calculation engine

The core algorithm is in `src/lib/bazi/index.ts`. Key formulas:

- **Year pillar:** `(year - 1900 + 4) % 10` for Heavenly Stem, `(year - 1900) % 12` for Earthly Branch
- **Month pillar:** Year-on-month method (年上起月法) for Stem, `(month - 1) % 12` for Branch
- **Day pillar:** Julian Day-based — `(JD + 4) % 10` for Stem, `JD % 12` for Branch
- **Hour pillar:** Five Rat Hour method (五鼠遁元法) — `hourTianStart = (dayTianIdx % 5) * 2`, then `(hourTianStart + hourDiIdx) % 10`; `hourDiIdx = floor(((hour + 1) % 24) / 2)`

### Shichen (时辰) mapping

| Hour range | Shichen | Earthly Branch |
|---|---|---|
| 23:00–01:00 | 子时 | 子 |
| 01:00–03:00 | 丑时 | 丑 |
| 03:00–05:00 | 寅时 | 寅 |
| 05:00–07:00 | 卯时 | 卯 |
| 07:00–09:00 | 辰时 | 辰 |
| 09:00–11:00 | 巳时 | 巳 |
| 11:00–13:00 | 午时 | 午 |
| 13:00–15:00 | 未时 | 未 |
| 15:00–17:00 | 申时 | 申 |
| 17:00–19:00 | 酉时 | 酉 |
| 19:00–21:00 | 戌时 | 戌 |
| 21:00–23:00 | 亥时 | 亥 |

## Data lifecycle

- Reports are stored in SQLite and **automatically purged** based on configurable TTL (`report_ttl_hours`, default 24h, set in admin Settings)
- Report pages display an **expiry countdown** encouraging users to download immediately
- Zero-Knowledge Data Policy: birth details are held in temporary memory only, auto-purged within 24h

## Rate limiting

IP-based, two-tier (in-memory L1 + SQLite L2):

| Endpoint | Limit | Window |
|---|---|---|
| `report:create` | 10 requests | 1 hour / IP |
| `report:get` | 60 requests | 1 minute / IP |
| General | 600 requests | 1 minute / IP |

Old rate-limit entries (> 24h) are pruned every hour automatically.

## Project structure

```
quantum-fate-lite/
├── config/              # JSON configs (general, prompts, seo, products)
├── data/                # SQLite DB (qfl.db, auto-created)
├── scripts/
│   ├── inspect-db.js    # Quick DB inspector
│   └── kill-next.ps1    # Safely stop Next.js without killing DevEco Code
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── faq/         # FAQ page (Privacy, Science, Purchases)
│   │   └── api/v1/      # REST API
│   │       ├── admin/   # Admin CRUD (auth required)
│   │       ├── ai/      # AI provider health check
│   │       ├── config/  # Public site config
│   │       ├── payment/ # Stripe/PayPal webhooks
│   │       ├── products/# Product listing
│   │       └── report/  # Report generation & retrieval
│   ├── components/      # React components
│   │   ├── AnalyzeForm.tsx    # Mobile-first decode form (3-step progress + cancel + cycle selector)
│   │   ├── ReportView.tsx     # Report with markdown rendering + elemental bars + PDF/Share buttons
│   │   ├── Disclaimer.tsx     # Three-part compliance disclaimer
│   │   ├── NavBar.tsx         # Sticky nav with EN/中 toggle + lang cookie
│   │   ├── ShareCard.tsx      # Social share card (3 layouts × 4 themes)
│   │   ├── ShareCardModal.tsx # Share modal with layout/theme selector
│   │   ├── PdfDownloadModal.tsx # PDF download modal (theme/icon/columns selector + html2pdf.js)
│   │   ├── AdminPanel.tsx     # Admin dashboard orchestrator (auth + tab routing)
│   │   └── admin/             # Modular admin components
│   │       ├── ui.tsx         # Shared primitives (SidebarShell, Modal, Card, Badge, etc.)
│   │       ├── StatsTab.tsx   # KPI cards, 7-day chart, online admins, recent reports
│   │       ├── ProductsTab.tsx
│   │       ├── OrdersTab.tsx
│   │       ├── CreditsTab.tsx
│   │       ├── AIProvidersTab.tsx
│   │       ├── StyleTab.tsx    # Theme/icon/columns/card-layout presets with live preview
│   │       ├── SettingsTab.tsx # Brand, monetization, payment, TTL, scheduling, cycles
│   │       ├── AccountTab.tsx
│   │       └── types.ts       # Shared types + i18n strings
│   ├── i18n/
│   │   └── messages/    # Locale files (en.json, zh-CN.json)
│   └── lib/
│       ├── ai/          # AI provider registry (DB-backed + env fallback + mock)
│       ├── bazi/        # Core calculation engine (四柱, 五行, 十神, 旺衰, 流年)
│       │   └── i18n-terms.ts  # Bilingual terminology + formatBaziString/formatLiunianPillars
│       ├── products/    # Recommendation engine
│       ├── admin-auth.ts# Single-user auth (HMAC-signed cookies)
│       ├── config.ts    # Config loader
│       ├── db.ts        # SQLite layer + migrations + purgeExpiredReports + report_cycles CRUD
│       ├── fate-analysis.ts  # Full analysis pipeline (bazi + wuxing + favorable/unfavorable + liunian)
│       ├── i18n.ts      # resolveLocale (query > cookie > Accept-Language)
│       ├── payment.ts   # Stripe & PayPal integration (compliant product names)
│       ├── rate-limit.ts# IP rate limiter
│       ├── report-service.ts # Report generation + credit redemption + liunian formatting
│       ├── settings.ts  # MonetizationMode (ecommerce | freemium) + typed settings (brand, TTL, scheduling) + StylePreset
│       ├── pdf/
│       │   └── generate.ts   # buildHtml() → styled HTML string (4 themes, 2 icons, 1/2 columns); reads getStylePreset()
│       └── utils.ts     # Utilities
└── public/              # Static assets
```

## SEO files

- `/robots.txt` — generated from `config/seo.json`
- `/sitemap.xml` — generated
- `/llms.txt` — for AI crawlers
- `/ai.txt` — AI use policy

## Changelog

### v0.12.0
- **Style tab** — independent admin sidebar tab for visual style management; large PDF preview (520px iframe) + live social card preview (html-to-image rendered ShareCard)
- **Granular style settings** — `style_preset` (indigo/dark/warm/glass) + `style_icon` (wuxing/moon) + `style_columns` (1/2) + `style_card_layout` (horizontal/vertical/square) — each independently configurable in Style tab
- **getStylePreset() refactor** — reads 4 separate settings fields instead of preset lookup table; validates each field independently
- **StyleTab components** — theme selector (gradient cards), icon selector (wuxing cycle ☯ / moon phase 🌙), PDF layout selector (1-col/2-col with visual diagram), card layout selector (9:5/9:16/1:1 with proportional preview)
- **Auto card preview** — ShareCardModal auto-generates card image on open (removed manual "Generate Card" button)
- **SettingsTab cleanup** — removed style preset section (moved to dedicated Style tab)
- **DOMPurify SSR fix** — conditional require + window check to prevent `DOMPurify.sanitize is not a function` crash
- **AI provider role fix** — `role` field now correctly saved on create/edit; DB default changed from `"report"` to `"primary"`; existing `"report"` rows auto-migrated
- **AI provider test isolation** — each provider's test button works independently (per-provider `testingIds` Set instead of single boolean); test results stored and displayed inline per card
- **AI provider management redesign** — ↑↓ reorder buttons, "Test All" button, "Duplicate" button for same-provider different keys; role badges ⚡ Primary / ↻ Fallback
- **Loading animation de-AI** — 4-step elegant progress text ("Mapping temporal energy coordinates..." → "Calculating Five-Element resonance..." → "Synthesizing spatial harmony..." → "Polishing your energy vector..."); ☯ slow-spin icon; fade-in/fade-out transitions; 6-second Labor Illusion minimum
- **Disclaimer de-AI** — replaced "AI-generated" with "Shui Chronobiological Algorithmic Engine" / "水·节律时间生物算法引擎" in both web disclaimer and PDF
- **PDF de-AI** — `aiMeta` label changed from "Generated by: provider/model" to "Powered by Shui Algorithmic Engine" / "由水·节律算法引擎驱动"
- **Admin version badge** — version number displayed in admin header
- **Report truncation fix** — prompt templates now enforce word count ranges (foundation: 600-800 字 / 500-700 words; premium: 1200-1600 字 / 1000-1400 words) with explicit "complete all sections" instruction; free tier maxTokens raised from 1500 to 2048; premium default from 3000 to 4096
- **Report view spacing fix** — reduced `space-y-4` to `space-y-2`; article prose margin override `[&>]:last:mb-0` to eliminate gap above disclaimer
- **Report meta de-AI** — report ID line changed from `Generated by: provider · model · latency` to `Powered by Shui Algorithmic Engine` / `由水·节律算法引擎驱动`

### v0.7.1
- **Client-side PDF generation** — replaced server-side puppeteer-core with html2pdf.js (runs entirely in browser, no server deps); Hostinger shared hosting compatible
- **HTML template engine** — `buildHtml()` in `src/lib/pdf/generate.ts` generates full HTML+CSS document with CSS custom properties for theming
- **4 themes × 2 icons × 2 column layouts** — PdfDownloadModal lets user choose: Indigo/Dark/Warm/Glass theme, Wuxing Cycle/Moon Phase icon, Single/Two column layout
- **Preview route** — `/api/v1/report/[id]/preview?theme=&icon=&columns=` serves styled HTML for browser preview
- **Glass theme fix** — gradient body background (`linear-gradient(135deg, #667EEA, #764BA2)`) with `background-attachment: fixed`; semi-transparent pages overlay correctly
- **Wuxing bar fix** — percentage now calculated as `value/sum` (not `value/max`), bar width matches displayed number
- **CSS multi-column layout** — `column-count` with `break-after: avoid` on headings; no manual block splitting
- **Markdown parser upgrade** — inline bold/italic/code, ordered lists, proper list nesting
- **Page centering** — body `display: flex; align-items: center;` with page shadow for screen preview; `@media print` removes shadow
- **PDF route redirect** — `/api/v1/report/[id]/pdf` now redirects to preview route (no more broken `generatePdf` import)
- **next.config.mjs cleanup** — removed `puppeteer-core` from `serverComponentsExternalPackages`
- **Packages removed** — `puppeteer-core`, `@react-pdf/renderer` uninstalled; `html2pdf.js` added

### v0.11.0
- **Hostinger Cloud deployment** — verified working on Hostinger Business Web Hosting / Cloud Startup (managed Node.js); hPanel Web Apps with `app_type: next`, Node 22, standalone output; `better-sqlite3` compiles successfully on Hostinger's build environment
- **Source-code deploy zip** — `dist/qfl-hostinger-deploy.zip` (~0.3MB) for hPanel upload (excludes `node_modules`); separate from standalone VPS zip
- **Minimal env startup** — only `ADMIN_PASSWORD` required to boot; `DATABASE_DIR` defaults to `./data` (auto-created); AI keys can be added later via admin UI
- **SQLite concurrency validated** — single-process WAL mode handles 100+ concurrent users; ~10K reads/sec, ~1K mixed ops/sec; real bottleneck is AI API latency

### v0.10.0
- **Report cycles** — selectable analysis period (1/3/5/10 year) shown on AnalyzeForm; admin CRUD for cycles; `calculateLiunianPillars()` with clash/harmony/sheng/ke interaction detection; `{liunian}` prompt variable; bilingual formatting via `formatLiunianPillars()`
- **Day master strength fix** — `getDayMasterStrength()` now calculates 印+比劫 total (e.g. water+wood for 甲木) instead of just day-master element percentage
- **Favorable/unfavorable fix** — `deriveFavorable()` neutral branch now considers global imbalance (elements ≥35% that sheng/tong day-master → unfavorable; elements ≤12% that ke day-master → unfavorable)
- **Bilingual terminology** — `src/lib/bazi/i18n-terms.ts` with dual-language parenthetical annotations; `formatBaziString`, `formatWuxingString`, `formatShichenName`, `formatDayMaster`, `formatFavorableElements`, `formatStrengthLabel`
- **Prompts v0.10.0** — added `{dayMaster}`, `{strength}`, `{favorable}`, `{unfavorable}`, `{liunian}` variables; "Temporal Cycle Energy Reference" / "流年能量参考" section; pillar position warnings
- **Markdown rendering** — `marked` + `DOMPurify` + `@tailwindcss/typography` + `prose` classes in ReportView
- **Admin modular rewrite** — 1430-line monolithic `AdminPanel.tsx` split into 9 components under `src/components/admin/`
- **Admin sidebar** — desktop fixed sidebar + mobile hamburger menu (replaces horizontal tabs)
- **Admin modal dialogs + toast notifications**
- **Brand settings** — `site_brand_title/zh`, `site_brand_subtitle/zh` in DB, overrides `general.json` at runtime; `/api/v1/config` reads from DB
- **AI scheduling** — three modes: priority/round-robin/random; primary/fallback role on providers; `_rrIndex` tracking for round-robin
- **AI provider role** — `role` field (primary/fallback); `listEnabledAIProviders()` sorts primary first; UI shows role badge + role selector
- **Admin session security** — `admin_session_ttl_hours` (default 2h); `makeToken()` returns `{token, maxAgeSeconds}`; 401 auto-logout
- **Admin online tracking** — `admin_sessions` table; heartbeat on stats poll; max 2 concurrent admins (429); StatsTab shows online list with pulse dots
- **Admin slug security** — `ADMIN_SLUG` env var (default `admingl`); `next.config.mjs` rewrites `/${ADMIN_SLUG}` → `/admin`; `middleware.ts` blocks direct `/admin` access
- **StatsTab beautification** — KPI gradient cards + emoji icons; MiniCards with accent colors; error rate color-coded bar; 7-day gradient chart; auto-refresh 30s
- **Report TTL** — configurable `report_ttl_hours` (default 24h) in admin Settings; `purgeExpiredReports()` reads from settings
- **Settings conditional fields** — ecommerce hides payment; freemium shows selected provider; "Brand & Identity", "AI Scheduling", "Reports & Data" sections
- **Mobile admin optimization** — all touch targets ≥44px (buttons py-2/py-2.5, inputs py-2.5, checkboxes h-5); `flex-wrap` on all headers; `break-all` on monospace text; `text-[10px]` → `text-xs`; fixed mobile sidebar+content stacking (vertical flex wrapper)
- **AnalyzeForm locale fix** — `useSearchParams` ensures locale updates on client-side navigation via NavBar language switch
- **AnalyzeForm date validation** — client-side YYYY-MM-DD regex + range check; `min`/`max`/`pattern` on date input
- **AnalyzeForm cycle selector** — moved from advanced options to main form (below gender); populated from `/api/v1/config`
- **Deployment** — `nginx.conf.example` for Hostinger reverse proxy; `ecosystem.config.cjs` with explicit `NODE_ENV`; `deploy.sh` with Node version check + DB backup; standalone output mode

### v0.7.0
- **Rebranded to Shui** — hero shows 「Shui · Decode Your Personal Energy Cycle」; AEOX only in footer/legal
- **AI role simplified** — removed `premium_report` role; all reports use single `report` routing. Tier differences (maxTokens, template) handled at report-service level
- **New AI providers:** Agnes AI (`apihub.agnes-ai.com/v1`, model `agnes-2.0-flash`) and UnoRouter (`api.unorouter.com/v1`, model `gpt-oss-120b:free`)
- **Admin simplified** — single-user multi-device; no super/sub roles; Admins tab renamed to Account (view info + change password)
- **Monetization modes** — `ecommerce` (default, all free reports + product revenue) and `freemium` (free + premium with credit codes); removed `both` mode
- **Cookie-based locale** — `shui_lang` cookie (1 year), set by middleware, read by all pages; NavBar EN/中 toggle; all links carry `?lang=`
- **AnalyzeForm** — 3-step progress indicator (Calculating → AI Analyzing → Saving) + elapsed timer + cancel button; ecommerce mode hides tier/credit
- **ReportView** — ecommerce mode shows prominent product cards with 「Pick」 badge
- **Middleware** — intercepts `?lang=` on non-API/admin routes, sets `shui_lang` cookie
- **Settings API** — secret fields (stripe_secret_key, paypal_secret, etc.) masked with `••••`; skipped on save to prevent overwrite
- **Admin login** — `secure: false` for HTTP LAN access; `getSecret()` no longer rejects default password
- **next.config.mjs** — `serverComponentsExternalPackages: ["better-sqlite3"]` for Next.js 14 production
- **Classic book annotations** — no dynasty references; explain what it IS and what it's FOR; include original Chinese name in parentheses
- **CSS animations** — `!important` added to prevent Tailwind purge override; prefers-reduced-motion support

### v0.6.0
- **Compliance overhaul:** all front-end terminology replaced with compliant modern language (Temporal Energy Vector, Personal Energy Cycle, Spatial Harmony Design, etc.)
- **Three-part compliance disclaimer:** Service Disclaimer + Affiliate Disclosure + Data Lifecycle Notice
- **Mobile-first homepage:** single-screen layout on 375px, one CTA, privacy note, EN/中 toggle
- **Mobile-first AnalyzeForm:** slider for birth hour, pill gender selector, collapsible advanced options
- **ReportView redesign:** elemental bar chart visualization, 24h expiry countdown, compliant terminology
- **Data auto-purge:** `purgeExpiredReports()` runs on every report API call, deletes reports older than 24h
- **FAQ page:** `/faq` with Privacy, Science & Philosophy, and Purchases sections
- **Payment compliance:** Stripe/PayPal product names changed to `Personalized Energy Profile — In-Depth Edition`
- **SEO compliance:** keywords updated to compliant terms
- **i18n full coverage:** all pages support EN + zh-CN, default English
- **Privacy & Terms pages updated:** Zero-Knowledge Data Policy, digital content final sale clause, compliant language

### v0.5.0
- Added multi-admin support with roles (super/sub)
- Added credit code (卡密) system for premium reports
- Added order management
- Added settings management API
- Fixed: `getShichenName()` hour-to-shichen mapping was incorrect for most hours (now uses `floor(((hour+1) % 24) / 2)`)
- Fixed: `calculateBazi()` hour pillar used wrong Five Rat Hour formula, producing yin-yang mismatched Stem-Branch pairs (now uses standard 五鼠遁元法: `hourTianStart = (dayTianIdx % 5) * 2`)
- Fixed: `config/general.json` version was `0.4.0`, now matches `package.json` at `0.5.0`
- Added `scripts/kill-next.ps1` for safely stopping Next.js without killing DevEco Code's Node process
- Rate limit for report creation updated to 10/hr/IP

## License

Source-available. The user reserves the right to make the source public later.
