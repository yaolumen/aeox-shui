# Shui Card Design Spec

## 1. Data Elements

| Element | Key | Example (EN) | Example (ZH) | Notes |
|---|---|---|---|---|
| Day Master | `dayMaster` | `Bing` | `丙` | Core identity, the Heavenly Stem of birth day |
| Day Master Wuxing | `dayMasterWuxing` | `Fire` | `火` | Element of the Day Master |
| Day Master Strength | `dayMasterStrength` | `High Energy` | `高能量` | Enum: `strong` / `weak` / `neutral` |
| Bazi Pillars | `baziString` | `Wu-Wu, Ji-Si, Bing-Xu, Jia-Wu` | `戊午 己巳 丙戌 甲午` | 4 pillars (Year/Month/Day/Hour), each = 1 Heavenly Stem + 1 Earthly Branch |
| Wuxing Stats | `wuxing` | `wood:13 fire:50 earth:38 metal:0 water:0` | same | 5-element percentages, can include 0 |
| Favorable Elements | `favorableElements` | `Metal · Earth · Water` | `金 · 土 · 水` | Recommended catalysts to introduce |
| Unfavorable Elements | `unfavorableElements` | `Wood · Fire` | `木 · 火` | Elements to observe/moderate |

## 2. Brand Elements

| Element | Value (EN) | Value (ZH) |
|---|---|---|
| Brand Name | `S H U I` | `水 · 节 律` |
| Subtitle | `Personal Energy Profile` | `个人能量图谱` |
| Domain | `shui.aeox.uk` | `shui.aeox.uk` |
| Disclaimer | `For personal growth only. Not advice.` | `仅供个人成长参考，不构成建议。` |
| Tier (optional) | `Foundation` / `In-Depth` | `基础版` / `深度版` |

## 3. Five Elements Color System

| Element | EN Name | ZH Name | Color (HEX) | CSS Name | Icon |
|---|---|---|---|---|---|
| Wood | Wood | 木 | `#10B981` | emerald-500 | 🌿 |
| Fire | Fire | 火 | `#EF4444` | red-500 | 🔥 |
| Earth | Earth | 土 | `#F59E0B` | amber-500 | ⛰️ |
| Metal | Metal | 金 | `#6B7280` | zinc-500 | 🪙 |
| Water | Water | 水 | `#3B82F6` | blue-500 | 💧 |

## 4. Use Cases

### 4.1 Social Share Card
- **Purpose**: User shares their energy profile on social media
- **Format**: PNG image generated client-side via `html-to-image`
- **Size**: Vertical 9:16 (e.g. 630×1120) or Square 1:1 (630×630)
- **Must include**: Brand, Day Master, Bazi Pillars, Wuxing Bars, Catalysts, Domain, Disclaimer
- **Must NOT include**: Full report text, recommendations

### 4.2 PDF Cover Page
- **Purpose**: First page of the downloadable PDF report
- **Format**: A4 portrait (595.28×841.89 pt), top ~60% area
- **Must include**: Brand, Subtitle, Day Master, Bazi Pillars, Report ID, Date, AI Provider info
- **Must NOT include**: Wuxing bars (those go on page 2)

### 4.3 Web Report Summary Card
- **Purpose**: In-page analysis summary on `/report/[id]`
- **Format**: Responsive HTML, max-w-sm mobile / max-w-2xl desktop
- **Must include**: Bazi Pillars, Wuxing Bars, Day Master, Strength, Catalysts, Classic reference

## 5. Typography

| Usage | Font | Weight | Letter Spacing |
|---|---|---|---|
| Brand `S H U I` | `system-ui, -apple-system, sans-serif` | 700 | 6–8px |
| Headings | `system-ui` or CJK fallback | 700 | normal |
| Body / Data | `system-ui` | 400–500 | normal |
| Monospace (Bazi) | `ui-monospace, monospace` | 600 | normal |
| CJK Support | `SimHei`, `Noto Sans CJK`, or `PingFang SC` | — | — |

## 6. Layout Patterns

### Vertical Card (Share)
```
┌─────────────────────┐
│      S H U I        │  ← Brand, centered, wide spacing
│  Personal Energy... │  ← Subtitle
│─────────────────────│  ← Divider
│                     │
│    丙 (Fire)        │  ← Day Master + Wuxing, large
│    High Energy      │  ← Strength label
│                     │
│  戊午 己巳 丙戌 甲午 │  ← 4 Bazi Pillars in row
│                     │
│  ── flex spacer ──  │
│                     │
│  Wood  ████████ 13% │  ← Wuxing bars
│  Fire  ██████████50%│
│  Earth ████████ 38% │
│  Metal ░░░░░░░  0%  │
│  Water ░░░░░░░  0%  │
│                     │
│  ⚡ Metal·Earth·Water│  ← Catalysts
│─────────────────────│  ← Divider
│  shui.aeox.uk       │  ← Domain
│  For personal...    │  ← Disclaimer
└─────────────────────┘
```

### Horizontal Card (PDF Cover)
```
┌──────────────────────────────────────────┐
│                                          │
│  S H U I                    Wood ████ 13%│
│  Personal Energy Profile     Fire ███ 50%│
│                               Earth ██ 38%│
│  丙 (Fire)                    Metal   0% │
│  High Energy                  Water   0% │
│                                          │
│  戊午  己巳  丙戌  甲午                    │
│                                          │
│  ⚡ Metal · Earth · Water                │
│  ──────────────────────────────          │
│  shui.aeox.uk        For personal...     │
└──────────────────────────────────────────┘
```

## 7. Design Constraints

- **No external images** — all graphics must be CSS/SVG/emoji, no hosted images
- **No animation** — static output (PNG / PDF)
- **CJK text must render** — card designs must work with both Latin and CJK characters
- **Dark backgrounds preferred** — indigo/purple gradient is the primary brand theme
- **Zero values still shown** — `metal:0 water:0` must be visible (empty bar)
- **Mobile-first** — share cards are viewed on phones; font sizes must be legible at 630px width
- **No fortune-telling language** — use "Energy Level", "Catalysts", "Profile" (never "Destiny", "Fate", "Prediction")

## 8. Color Themes (for variation)

| Theme | Background | Accent | Text |
|---|---|---|---|
| Indigo Gradient | `linear-gradient(160deg, #4F46E5, #7C3AED, #6D28D9)` | `#6EE7B7` (catalyst) | `#FFFFFF` |
| Dark Minimal | `#0F0F11` | `#818CF8` / `#6EE7B7` | `#E0E7FF` |
| Warm Earth | `linear-gradient(170deg, #1C1917, #292524, #1C1917)` | `#D97706` / `#FDE68A` | `#FDE68A` |
| Glassmorphism | `linear-gradient(135deg, #667EEA, #764BA2)` + frosted glass panel | `#6EE7B7` | `#FFFFFF` |

Admin management: **Style tab** (`/admin` → Style) provides visual preset selector with live PDF + card previews. Settings: `style_preset` (theme), `style_icon` (wuxing/moon), `style_columns` (1/2), `style_card_layout` (horizontal/vertical/square).

## 9. API Data Shape (for reference)

```json
{
  "dayMaster": "丙",
  "dayMasterWuxing": "火",
  "dayMasterStrength": "strong",
  "baziString": ["戊午", "己巳", "丙戌", "甲午"],
  "wuxing": { "wood": 13, "fire": 50, "earth": 38, "metal": 0, "water": 0 },
  "favorableElements": ["金", "土", "水"],
  "unfavorableElements": ["木", "火"],
  "tier": "free",
  "locale": "en"
}
```
