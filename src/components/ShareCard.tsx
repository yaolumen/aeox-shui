"use client";
import type { Locale } from "@/lib/config";
import type { WuxingStats } from "@/lib/bazi";

export type CardLayout = "horizontal" | "vertical" | "square";
export type CardTheme = "indigo" | "dark" | "warm" | "glass";

interface ShareCardProps {
  locale: Locale;
  dayMaster: string;
  dayMasterWuxing: string;
  dayMasterStrength: string;
  baziString: string[];
  wuxing: WuxingStats;
  favorableElements: string[];
  layout?: CardLayout;
  theme?: CardTheme;
}

const CARD_DIMS: Record<CardLayout, { w: number; h: number }> = {
  horizontal: { w: 630, h: 360 },
  vertical: { w: 630, h: 1120 },
  square: { w: 630, h: 630 },
};

const WX_NAME: Record<string, Record<Locale, string>> = {
  wood: { en: "Wood", "zh-CN": "木" },
  fire: { en: "Fire", "zh-CN": "火" },
  earth: { en: "Earth", "zh-CN": "土" },
  metal: { en: "Metal", "zh-CN": "金" },
  water: { en: "Water", "zh-CN": "水" },
};

const WX_COLOR: Record<string, string> = {
  wood: "#10B981",
  fire: "#EF4444",
  earth: "#F59E0B",
  metal: "#6B7280",
  water: "#3B82F6",
};

const WX_ICON: Record<string, string> = {
  wood: "🌿", fire: "🔥", earth: "⛰️", metal: "🪙", water: "💧",
};

const STRENGTH_LABEL: Record<string, Record<Locale, string>> = {
  strong: { en: "High Energy", "zh-CN": "高能量" },
  weak: { en: "Low Energy", "zh-CN": "低能量" },
  neutral: { en: "Balanced", "zh-CN": "平衡" },
};

const T = {
  en: {
    brand: "S H U I",
    subtitle: "Personal Energy Profile",
    foundation: "Foundation",
    dayMaster: "Core Element",
    strength: "Energy Level",
    catalysts: "Catalysts",
    disclaimer: "For personal growth only. Not advice.",
    fourPillars: "Four Pillars",
  },
  "zh-CN": {
    brand: "S H U I",
    subtitle: "个人能量图谱",
    foundation: "基础版",
    dayMaster: "核心元素",
    strength: "能量水平",
    catalysts: "催化剂",
    disclaimer: "仅供个人成长参考，不构成建议。",
    fourPillars: "四柱",
  },
} as const;

type ThemeColors = {
  bg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  pillarBg: string;
  pillarBorder: string;
  barBg: string;
  catalystBg: string;
  catalystColor: string;
  catalystBorder: string;
  strengthBg: string;
  strengthBorder: string;
  strengthColor: string;
  orb1: string;
  orb2: string;
  orb3?: string;
  brandColor: string;
};

function getThemeColors(theme: CardTheme): ThemeColors {
  switch (theme) {
    case "dark":
      return {
        bg: "#0F0F11",
        text: "#E0E7FF",
        textSecondary: "#C7D2FE",
        textMuted: "rgba(129,140,248,0.4)",
        divider: "linear-gradient(90deg, transparent, rgba(224,231,255,0.15), transparent)",
        pillarBg: "rgba(224,231,255,0.06)",
        pillarBorder: "rgba(224,231,255,0.1)",
        barBg: "rgba(224,231,255,0.08)",
        catalystBg: "rgba(110,231,183,0.15)",
        catalystColor: "#6EE7B7",
        catalystBorder: "rgba(110,231,183,0.3)",
        strengthBg: "rgba(52,211,153,0.1)",
        strengthBorder: "rgba(52,211,153,0.3)",
        strengthColor: "#6EE7B7",
        orb1: "#818CF8",
        orb2: "#6EE7B7",
        brandColor: "#A5B4FC",
      };
    case "warm":
      return {
        bg: "linear-gradient(170deg, #1C1917 0%, #292524 50%, #1C1917 100%)",
        text: "#FDE68A",
        textSecondary: "rgba(253,230,138,0.8)",
        textMuted: "rgba(253,230,138,0.4)",
        divider: "linear-gradient(90deg, transparent, rgba(253,230,138,0.25), transparent)",
        pillarBg: "rgba(253,230,138,0.08)",
        pillarBorder: "rgba(253,230,138,0.2)",
        barBg: "rgba(253,230,138,0.12)",
        catalystBg: "rgba(217,119,6,0.18)",
        catalystColor: "#FDE68A",
        catalystBorder: "rgba(253,230,138,0.3)",
        strengthBg: "rgba(245,158,11,0.15)",
        strengthBorder: "rgba(245,158,11,0.3)",
        strengthColor: "#FDE68A",
        orb1: "#F59E0B",
        orb2: "#D97706",
        brandColor: "#FDE68A",
      };
    case "glass":
      return {
        bg: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
        text: "#FFFFFF",
        textSecondary: "rgba(255,255,255,0.8)",
        textMuted: "rgba(255,255,255,0.5)",
        divider: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        pillarBg: "rgba(255,255,255,0.08)",
        pillarBorder: "rgba(255,255,255,0.12)",
        barBg: "rgba(255,255,255,0.1)",
        catalystBg: "rgba(110,231,183,0.15)",
        catalystColor: "#6EE7B7",
        catalystBorder: "rgba(110,231,183,0.3)",
        strengthBg: "rgba(52,211,153,0.15)",
        strengthBorder: "rgba(52,211,153,0.3)",
        strengthColor: "#6EE7B7",
        orb1: "#EF4444",
        orb2: "#3B82F6",
        orb3: "#6EE7B7",
        brandColor: "#FFFFFF",
      };
    default: // indigo
      return {
        bg: "linear-gradient(160deg, #4F46E5 0%, #7C3AED 50%, #6D28D9 100%)",
        text: "#FFFFFF",
        textSecondary: "rgba(255,255,255,0.8)",
        textMuted: "rgba(255,255,255,0.5)",
        divider: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        pillarBg: "rgba(255,255,255,0.08)",
        pillarBorder: "rgba(255,255,255,0.12)",
        barBg: "rgba(255,255,255,0.12)",
        catalystBg: "rgba(110,231,183,0.15)",
        catalystColor: "#6EE7B7",
        catalystBorder: "rgba(110,231,183,0.3)",
        strengthBg: "rgba(52,211,153,0.2)",
        strengthBorder: "rgba(52,211,153,0.4)",
        strengthColor: "#6EE7B7",
        orb1: "#EF4444",
        orb2: "#6EE7B7",
        brandColor: "#FFFFFF",
      };
  }
}

export function ShareCard(props: ShareCardProps) {
  const {
    locale, dayMaster, dayMasterWuxing, dayMasterStrength,
    baziString, wuxing, favorableElements,
    layout = "horizontal", theme = "indigo",
  } = props;
  const t = T[locale];
  const c = getThemeColors(theme);
  const dims = CARD_DIMS[layout];

  const wxEntries = Object.entries(wuxing) as [string, number][];
  const maxVal = Math.max(...wxEntries.map(([, v]) => v), 1);
  const strengthLabel = STRENGTH_LABEL[dayMasterStrength]?.[locale] ?? dayMasterStrength;
  const wxName = (k: string) => WX_NAME[k]?.[locale] ?? k;
  const dmWuxingKey = dayMasterWuxing.toLowerCase();
  const dmWuxingLabel = wxName(dmWuxingKey);
  const dmIcon = WX_ICON[dmWuxingKey] ?? "⚪";
  const favNames = favorableElements.map((e) => wxName(e)).join(" · ");

  if (layout === "horizontal") {
    return <HorizontalCard dims={dims} c={c} t={t} dayMaster={dayMaster} dmWuxingLabel={dmWuxingLabel} dmIcon={dmIcon} strengthLabel={strengthLabel} baziString={baziString} wxEntries={wxEntries} maxVal={maxVal} wxName={wxName} favNames={favNames} />;
  }
  if (layout === "square") {
    return <SquareCard dims={dims} c={c} t={t} dayMaster={dayMaster} dmWuxingLabel={dmWuxingLabel} dmIcon={dmIcon} strengthLabel={strengthLabel} baziString={baziString} wxEntries={wxEntries} maxVal={maxVal} wxName={wxName} favNames={favNames} />;
  }
  return <VerticalCard dims={dims} c={c} t={t} dayMaster={dayMaster} dmWuxingLabel={dmWuxingLabel} dmIcon={dmIcon} strengthLabel={strengthLabel} baziString={baziString} wxEntries={wxEntries} maxVal={maxVal} wxName={wxName} favNames={favNames} theme={theme} />;
}

function Orb({ color, size, top, right, bottom, left, opacity }: {
  color: string; size: number; top?: string; right?: string; bottom?: string; left?: string; opacity: number;
}) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%", filter: "blur(60px)", opacity,
      width: size, height: size, background: color, top, right, bottom, left,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

function Divider({ bg }: { bg: string }) {
  return <div style={{ height: 1, background: bg }} />;
}

function WuxingBarRow({ k, v, maxVal, wxName, c, icon, compact }: {
  k: string; v: number; maxVal: number; wxName: (k: string) => string; c: ThemeColors; icon: string; compact?: boolean;
}) {
  const pct = Math.round((v / maxVal) * 100);
  const color = WX_COLOR[k] ?? "#8B5CF6";
  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: compact ? 9 : 10, color: c.textSecondary, marginBottom: compact ? 2 : 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{icon} {wxName(k)}</span>
        <span style={{ flexShrink: 0, marginLeft: 4 }}>{pct}%</span>
      </div>
      <div style={{ height: compact ? 6 : 7, borderRadius: 3, background: c.barBg, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, minWidth: pct > 0 ? 4 : 0 }} />
      </div>
    </div>
  );
}

function WuxingBarRowWide({ k, v, maxVal, wxName, c, icon }: {
  k: string; v: number; maxVal: number; wxName: (k: string) => string; c: ThemeColors; icon: string;
}) {
  const pct = Math.round((v / maxVal) * 100);
  const color = WX_COLOR[k] ?? "#8B5CF6";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 50px", alignItems: "center", gap: 10, fontSize: 15 }}>
      <span style={{ color: c.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{icon} {wxName(k)}</span>
      <div style={{ height: 12, borderRadius: 6, background: c.barBg, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: color }} />
      </div>
      <span style={{ textAlign: "right", color: c.textMuted, fontFamily: "ui-monospace, monospace", fontSize: 14 }}>{pct}%</span>
    </div>
  );
}

function PillarChip({ text, c, compact }: { text: string; c: ThemeColors; compact?: boolean }) {
  return (
    <div style={{
      padding: compact ? "3px 6px" : "5px 8px",
      borderRadius: 8,
      background: c.pillarBg,
      border: `1px solid ${c.pillarBorder}`,
      fontSize: compact ? 11 : 13,
      fontWeight: 600,
      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      color: c.text,
      textAlign: "center",
      whiteSpace: "nowrap",
      minWidth: 0,
    }}>
      {text}
    </div>
  );
}

function CatalystChip({ favNames, c }: { favNames: string; c: ThemeColors }) {
  if (!favNames) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: c.catalystBg, color: c.catalystColor,
      border: `1px solid ${c.catalystBorder}`,
    }}>
      ⚡ {favNames}
    </span>
  );
}

function StrengthBadge({ label, c }: { label: string; c: ThemeColors }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
      background: c.strengthBg, color: c.strengthColor,
      border: `1px solid ${c.strengthBorder}`,
    }}>
      {label}
    </span>
  );
}

interface CardInnerProps {
  dims: { w: number; h: number };
  c: ThemeColors;
  t: Record<string, string>;
  dayMaster: string;
  dmWuxingLabel: string;
  dmIcon: string;
  strengthLabel: string;
  baziString: string[];
  wxEntries: [string, number][];
  maxVal: number;
  wxName: (k: string) => string;
  favNames: string;
  theme?: CardTheme;
}

function HorizontalCard({ dims, c, t, dayMaster, dmWuxingLabel, dmIcon, strengthLabel, baziString, wxEntries, maxVal, wxName, favNames }: CardInnerProps) {
  return (
    <div id="share-card" style={{
      width: dims.w, height: dims.h,
      background: c.bg, color: c.text,
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      padding: 32, boxSizing: "border-box",
      borderRadius: 24, position: "relative", overflow: "hidden",
    }}>
      <Orb color={c.orb1} size={160} top="-50px" right="-30px" opacity={0.3} />
      <Orb color={c.orb2} size={140} bottom="-40px" left="-20px" opacity={0.2} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: c.brandColor, whiteSpace: "nowrap" }}>{t.brand}</div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: c.textMuted, marginTop: 2, textTransform: "uppercase" }}>{t.subtitle}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: c.textMuted, textTransform: "uppercase" }}>{t.foundation}</div>
          <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2, opacity: 0.7 }}>shui.aeox.uk</div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}><Divider bg={c.divider} /></div>
      <div style={{ height: 16 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative", zIndex: 1 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontSize: 72, fontWeight: 700, lineHeight: 1, color: c.text,
            fontFamily: "'Noto Sans SC', 'PingFang SC', 'SimHei', sans-serif",
            textShadow: `0 0 40px ${c.orb1}66, 0 0 80px ${c.orb1}33`,
          }}>{dayMaster}</div>
          <div style={{ fontSize: 14, color: c.textSecondary, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{dmIcon}</span><span>{dmWuxingLabel}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <StrengthBadge label={strengthLabel} c={c} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: c.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
            {t.fourPillars}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflow: "hidden", minWidth: 0 }}>
            {baziString.map((p: string, i: number) => <PillarChip key={i} text={p} c={c} />)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 10, position: "relative", zIndex: 1 }}>
        {wxEntries.map(([k, v]: [string, number]) => (
          <WuxingBarRow key={k} k={k} v={v} maxVal={maxVal} wxName={wxName} c={c} icon={WX_ICON[k] ?? "⚪"} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}><Divider bg={c.divider} /></div>
      <div style={{ height: 8 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
          <CatalystChip favNames={favNames} c={c} />
          <span style={{ color: c.textMuted, flexShrink: 0 }}>{t.catalysts}</span>
        </div>
        <div style={{ color: c.textMuted, fontStyle: "italic", flexShrink: 0, fontSize: 10, textAlign: "right", maxWidth: 180 }}>{t.disclaimer}</div>
      </div>
    </div>
  );
}

function VerticalCard({ dims, c, t, dayMaster, dmWuxingLabel, dmIcon, strengthLabel, baziString, wxEntries, maxVal, wxName, favNames, theme }: CardInnerProps) {
  const isGlass = theme === "glass";
  const pad = isGlass ? 28 : 56;
  const innerContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <Orb color={c.orb1} size={300} top="-100px" right="-80px" opacity={0.3} />
      <Orb color={c.orb2} size={260} bottom="-60px" left="-60px" opacity={0.2} />
      {c.orb3 && <Orb color={c.orb3} size={160} top="35%" right="-40px" opacity={0.15} />}

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, color: c.brandColor, whiteSpace: "nowrap" }}>{t.brand}</div>
        <div style={{ fontSize: 13, letterSpacing: 2, color: c.textMuted, marginTop: 4, textTransform: "uppercase" }}>{t.subtitle}</div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}><Divider bg={c.divider} /></div>
      <div style={{ height: 24 }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 180, fontWeight: 700, lineHeight: 1, color: c.text,
          fontFamily: "'Noto Sans SC', 'PingFang SC', 'SimHei', sans-serif",
          textShadow: `0 0 60px ${c.orb1}99, 0 0 120px ${c.orb1}4D`,
        }}>{dayMaster}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 28 }}>{dmIcon}</span>
          <span style={{ fontSize: 20, letterSpacing: 2, color: c.textSecondary }}>{dmWuxingLabel}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <StrengthBadge label={strengthLabel} c={c} />
        </div>
      </div>

      <div style={{ marginTop: 36, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", fontSize: 11, letterSpacing: 2, color: c.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
          {t.fourPillars}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {baziString.map((p: string, i: number) => <PillarChip key={i} text={p} c={c} />)}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, position: "relative", zIndex: 1 }}>
        {wxEntries.map(([k, v]: [string, number]) => (
          <WuxingBarRowWide key={k} k={k} v={v} maxVal={maxVal} wxName={wxName} c={c} icon={WX_ICON[k] ?? "⚪"} />
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: c.textMuted, textTransform: "uppercase", marginBottom: 10 }}>{t.catalysts}</div>
        <CatalystChip favNames={favNames} c={c} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}><Divider bg={c.divider} /></div>
      <div style={{ height: 16 }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 16, letterSpacing: 2, color: c.textSecondary }}>shui.aeox.uk</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4, fontStyle: "italic" }}>{t.disclaimer}</div>
      </div>
    </div>
  );

  return (
    <div id="share-card" style={{
      width: dims.w, height: dims.h,
      background: c.bg, color: c.text,
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: 36, position: "relative", overflow: "hidden",
    }}>
      {isGlass ? (
        <div style={{
          position: "absolute", inset: 28,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 24,
          display: "flex", flexDirection: "column",
          padding: 40, zIndex: 1,
        }}>
          {innerContent}
        </div>
      ) : (
        <div style={{ padding: pad, display: "flex", flexDirection: "column", position: "relative" }}>
          {innerContent}
        </div>
      )}
    </div>
  );
}

function SquareCard({ dims, c, t, dayMaster, dmWuxingLabel, dmIcon, strengthLabel, baziString, wxEntries, maxVal, wxName, favNames }: CardInnerProps) {
  return (
    <div id="share-card" style={{
      width: dims.w, height: dims.h,
      background: c.bg, color: c.text,
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      padding: 40, boxSizing: "border-box",
      borderRadius: 36, position: "relative", overflow: "hidden",
    }}>
      <Orb color={c.orb1} size={220} top="-80px" right="-60px" opacity={0.35} />
      <Orb color={c.orb2} size={200} bottom="-60px" left="-50px" opacity={0.25} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: c.brandColor, whiteSpace: "nowrap" }}>{t.brand}</div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: c.textMuted, textTransform: "uppercase" }}>{t.foundation}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20, position: "relative", zIndex: 1 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontSize: 120, fontWeight: 700, lineHeight: 1, color: c.text,
            fontFamily: "'Noto Sans SC', 'PingFang SC', 'SimHei', sans-serif",
            textShadow: `0 0 60px ${c.orb1}99, 0 0 120px ${c.orb1}4D`,
          }}>{dayMaster}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 18 }}>{dmIcon}</span>
            <span style={{ fontSize: 14, color: c.textSecondary }}>{dmWuxingLabel}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: c.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
            {t.fourPillars}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, overflow: "hidden" }}>
            {baziString.map((p: string, i: number) => <PillarChip key={i} text={p} c={c} compact />)}
          </div>
          <div style={{ marginTop: 10 }}>
            <StrengthBadge label={strengthLabel} c={c} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10, position: "relative", zIndex: 1 }}>
        {wxEntries.map(([k, v]: [string, number]) => (
          <WuxingBarRow key={k} k={k} v={v} maxVal={maxVal} wxName={wxName} c={c} icon={WX_ICON[k] ?? "⚪"} compact />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}><Divider bg={c.divider} /></div>
      <div style={{ height: 8 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, position: "relative", zIndex: 1, minWidth: 0, overflow: "hidden" }}>
        <CatalystChip favNames={favNames} c={c} />
        <div style={{ color: c.textMuted, flexShrink: 0 }}>shui.aeox.uk</div>
      </div>
    </div>
  );
}
