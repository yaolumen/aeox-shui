/**
 * 统一术语翻译层 — 天干地支 / 时辰 / 五行 / 十神
 * 根据locale输出双语标注（主语言+括号副语言），确保AI prompt中的术语一致
 */

import type { Bazi, WuxingStats, TenGodsStats, LiunianPillar } from './index';
import { CONSTANTS } from './index';

const { WUXING_NAMES, TEN_GODS_NAMES } = CONSTANTS;

type Locale = 'zh-CN' | 'en';

const TIANGAN_EN: Record<string, string> = {
  '甲': 'Jia', '乙': 'Yi', '丙': 'Bing', '丁': 'Ding', '戊': 'Wu',
  '己': 'Ji', '庚': 'Geng', '辛': 'Xin', '壬': 'Ren', '癸': 'Gui',
};

const DIZHI_EN: Record<string, string> = {
  '子': 'Zi', '丑': 'Chou', '寅': 'Yin', '卯': 'Mao', '辰': 'Chen', '巳': 'Si',
  '午': 'Wu', '未': 'Wei', '申': 'Shen', '酉': 'You', '戌': 'Xu', '亥': 'Hai',
};

const SHICHEN_EN: Record<string, string> = {
  '子时': 'Zi Hour (23:00-01:00)', '丑时': 'Chou Hour (01:00-03:00)',
  '寅时': 'Yin Hour (03:00-05:00)', '卯时': 'Mao Hour (05:00-07:00)',
  '辰时': 'Chen Hour (07:00-09:00)', '巳时': 'Si Hour (09:00-11:00)',
  '午时': 'Wu Hour (11:00-13:00)', '未时': 'Wei Hour (13:00-15:00)',
  '申时': 'Shen Hour (15:00-17:00)', '酉时': 'You Hour (17:00-19:00)',
  '戌时': 'Xu Hour (19:00-21:00)', '亥时': 'Hai Hour (21:00-23:00)',
};

const SHICHEN_ZH: Record<string, string> = {
  '子时': '子时 (23:00-01:00)', '丑时': '丑时 (01:00-03:00)',
  '寅时': '寅时 (03:00-05:00)', '卯时': '卯时 (05:00-07:00)',
  '辰时': '辰时 (07:00-09:00)', '巳时': '巳时 (09:00-11:00)',
  '午时': '午时 (11:00-13:00)', '未时': '未时 (13:00-15:00)',
  '申时': '申时 (15:00-17:00)', '酉时': '酉时 (17:00-19:00)',
  '戌时': '戌时 (19:00-21:00)', '亥时': '亥时 (21:00-23:00)',
};

export function formatBaziString(bazi: Bazi, locale: Locale): string[] {
  const pillars = [
    `${bazi.year.tiangan}${bazi.year.dizhi}`,
    `${bazi.month.tiangan}${bazi.month.dizhi}`,
    `${bazi.day.tiangan}${bazi.day.dizhi}`,
    `${bazi.hour.tiangan}${bazi.hour.dizhi}`,
  ];

  if (locale === 'en') {
    return pillars.map((p) => {
      const t = p[0] ?? '';
      const d = p[1] ?? '';
      const tEn = TIANGAN_EN[t] ?? t;
      const dEn = DIZHI_EN[d] ?? d;
      return `${tEn}-${dEn} (${t}${d})`;
    });
  }

  return pillars.map((p) => {
    const t = p[0] ?? '';
    const d = p[1] ?? '';
    const tEn = TIANGAN_EN[t] ?? '';
    const dEn = DIZHI_EN[d] ?? '';
    return `${t}${d} (${tEn}-${dEn})`;
  });
}

export function formatWuxingString(wuxing: WuxingStats, locale: Locale): string {
  const entries = Object.entries(wuxing) as [keyof WuxingStats, number][];
  if (locale === 'en') {
    return entries.map(([k, v]) => `${WUXING_NAMES.en[k]} (${WUXING_NAMES.zh[k]}): ${v}%`).join(', ');
  }
  return entries.map(([k, v]) => `${WUXING_NAMES.zh[k]} (${WUXING_NAMES.en[k]}): ${v}%`).join(', ');
}

export function formatShichenName(shichenZh: string, locale: Locale): string {
  if (locale === 'en') {
    return SHICHEN_EN[shichenZh] ?? shichenZh;
  }
  return SHICHEN_ZH[shichenZh] ?? shichenZh;
}

export function formatDayMaster(dayMaster: string, locale: Locale): string {
  const wuxingZh = CONSTANTS.WUXING_TIANGAN[dayMaster] ?? '土';
  const wuxingKey = getWuxingKeyFromZh(wuxingZh);
  if (locale === 'en') {
    return `${TIANGAN_EN[dayMaster] ?? dayMaster} (${dayMaster}) — ${WUXING_NAMES.en[wuxingKey]} (${wuxingZh})`;
  }
  return `${dayMaster} (${TIANGAN_EN[dayMaster] ?? ''}) — ${wuxingZh} (${WUXING_NAMES.en[wuxingKey]})`;
}

export function formatFavorableElements(elements: string[], locale: Locale): string {
  return elements.map((e) => {
    const key = getWuxingKeyFromZh(e);
    if (locale === 'en') {
      return `${WUXING_NAMES.en[key]} (${e})`;
    }
    return `${e} (${WUXING_NAMES.en[key]})`;
  }).join(', ');
}

export function formatTenGodsString(tenGods: TenGodsStats, locale: Locale): string {
  const entries = Object.entries(tenGods) as [keyof TenGodsStats, number][];
  const nonZero = entries.filter(([, v]) => v > 0);
  if (locale === 'en') {
    return nonZero.map(([k, v]) => `${TEN_GODS_NAMES.en[k]} (${TEN_GODS_NAMES.zh[k]}): ${v}`).join(', ');
  }
  return nonZero.map(([k, v]) => `${TEN_GODS_NAMES.zh[k]} (${TEN_GODS_NAMES.en[k]}): ${v}`).join(', ');
}

function getWuxingKeyFromZh(zh: string): keyof WuxingStats {
  const map: Record<string, keyof WuxingStats> = {
    '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water',
  };
  return map[zh] ?? 'earth';
}

export function formatStrengthLabel(strength: 'strong' | 'weak' | 'neutral', locale: Locale): string {
  const labels = {
    strong: { en: 'High Energy (旺)', 'zh-CN': '旺 (High Energy)' },
    weak: { en: 'Low Energy (弱)', 'zh-CN': '弱 (Low Energy)' },
    neutral: { en: 'Balanced (中和)', 'zh-CN': '中和 (Balanced)' },
  };
  return labels[strength][locale];
}

const INTERACTION_TYPE_EN: Record<string, string> = {
  chong: 'Clash (冲)',
  he: 'Harmony (合)',
  sheng: 'Generate (生)',
  ke: 'Control (克)',
};

const INTERACTION_TYPE_ZH: Record<string, string> = {
  chong: '冲 (Clash)',
  he: '合 (Harmony)',
  sheng: '生 (Generate)',
  ke: '克 (Control)',
};

export function formatLiunianPillars(pillars: LiunianPillar[], locale: Locale): string {
  return pillars.map((p) => {
    const tEn = TIANGAN_EN[p.tiangan] ?? p.tiangan;
    const dEn = DIZHI_EN[p.dizhi] ?? p.dizhi;
    const wxEn = WUXING_NAMES.en[getWuxingKeyFromZh(p.wuxing)];
    const wxZh = p.wuxing;

    let pillarStr: string;
    if (locale === 'en') {
      pillarStr = `${p.year}: ${tEn}-${dEn} (${p.tiangan}${p.dizhi}) — ${wxEn} (${wxZh})`;
    } else {
      pillarStr = `${p.year}: ${p.tiangan}${p.dizhi} (${tEn}-${dEn}) — ${wxZh} (${wxEn})`;
    }

    if (p.interactions.length > 0) {
      const interactions = p.interactions.map((i) => {
        const typeLabel = locale === 'en' ? INTERACTION_TYPE_EN[i.type] : INTERACTION_TYPE_ZH[i.type];
        if (locale === 'en') {
          return `${typeLabel} with ${i.targetPillar}: ${i.description}`;
        }
        return `${typeLabel} ${i.targetPillar}: ${i.description}`;
      }).join('; ');
      pillarStr += ` | ${interactions}`;
    }

    return pillarStr;
  }).join('\n');
}
