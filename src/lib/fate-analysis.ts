/**
 * 命理分析：八字数据 → 完整 FateAnalysis 结构
 * Quantum Fate Lite · 轻量化版本
 * 复用 quantum-fate/src/lib/bazi + 简化十神映射
 */

import {
  calculateBazi,
  calculateWuxing,
  calculateTenGods,
  calculateLiunianPillars,
  getDayMasterStrength,
  getShichenName,
  CONSTANTS,
  WUXING_NAMES,
  type Bazi,
  type WuxingStats,
  type TenGodsStats,
  type LiunianPillar,
} from '@/lib/bazi';

const { WUXING_TIANGAN } = CONSTANTS;

export interface FateInput {
  birthDate: string;
  hour: number;
  gender: 'male' | 'female' | 'other';
  region?: string;
  cycleYears?: number;
}

export interface FateAnalysis {
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  bazi: Bazi;
  /** 八字四柱字符串（用于 AI prompt） */
  baziString: string[];
  wuxing: WuxingStats;
  dayMaster: string;
  dayMasterWuxing: string;
  dayMasterStrength: 'strong' | 'weak' | 'neutral';
  tenGods: TenGodsStats;
  shichenName: string;
  /** 主要元素（占比最高的） */
  dominantElement: string;
  /** 喜用神（基于日主旺衰 + 五行） */
  favorableElements: string[];
  /** 忌神 */
  unfavorableElements: string[];
  /** 流年柱 */
  liunianPillars: LiunianPillar[];
}

/**
 * 喜用神算法：
 * - 日主旺：克泄耗日主的元素为喜（财官食伤）
 * - 日主弱：生扶日主的元素为喜（印比）
 * - 日主中：需结合全局五行失衡判断——不能把已极旺的元素列为喜用
 *   优先用克泄耗调和，但如果全局某个元素极弱(<10%)则扶之
 */
function deriveFavorable(
  strength: 'strong' | 'weak' | 'neutral',
  dayMasterWuxing: string,
  wuxing: WuxingStats
): { favorable: string[]; unfavorable: string[] } {
  const cycle = ['木', '火', '土', '金', '水'] as const;
  const idx = cycle.indexOf(dayMasterWuxing as typeof cycle[number]);
  const shengWo = cycle[(idx + 4) % 5];
  const woSheng = cycle[(idx + 1) % 5];
  const keWo = cycle[(idx + 2) % 5];
  const woKe = cycle[(idx + 3) % 5];
  const tongWo = dayMasterWuxing;

  const wuxingZhMap: Record<string, keyof WuxingStats> = {
    '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water',
  };

  if (strength === 'strong') {
    return {
      favorable: [keWo, woSheng, woKe],
      unfavorable: [shengWo, tongWo],
    };
  }
  if (strength === 'weak') {
    return {
      favorable: [shengWo, tongWo],
      unfavorable: [keWo, woSheng, woKe],
    };
  }

  const neutralFavorable: string[] = [];
  const neutralUnfavorable: string[] = [];

  for (const el of cycle) {
    const pct = wuxing[wuxingZhMap[el] ?? 'earth'] ?? 0;
    const rel = getElementRelation(dayMasterWuxing, el);
    if (pct >= 35) {
      if (rel === 'shengWo' || rel === 'tongWo') {
        neutralUnfavorable.push(el);
      } else {
        neutralFavorable.push(el);
      }
    } else if (pct <= 12) {
      if (rel === 'keWo') {
        neutralUnfavorable.push(el);
      } else {
        neutralFavorable.push(el);
      }
    }
  }

  if (neutralFavorable.length === 0) {
    neutralFavorable.push(woKe, keWo);
  }
  if (neutralUnfavorable.length === 0) {
    neutralUnfavorable.push(tongWo, woSheng);
  }

  return { favorable: neutralFavorable, unfavorable: neutralUnfavorable };
}

type ElementRelation = 'tongWo' | 'shengWo' | 'woSheng' | 'keWo' | 'woKe';

function getElementRelation(dayMaster: string, target: string): ElementRelation {
  const cycle = ['木', '火', '土', '金', '水'] as const;
  const idx = cycle.indexOf(dayMaster as typeof cycle[number]);
  const shengWo = cycle[(idx + 4) % 5];
  const woSheng = cycle[(idx + 1) % 5];
  const keWo = cycle[(idx + 2) % 5];
  const woKe = cycle[(idx + 3) % 5];
  if (target === dayMaster) return 'tongWo';
  if (target === shengWo) return 'shengWo';
  if (target === woSheng) return 'woSheng';
  if (target === keWo) return 'keWo';
  if (target === woKe) return 'woKe';
  return 'tongWo';
}

export function analyzeFate(input: FateInput): FateAnalysis {
  const date = new Date(`${input.birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`无效的出生日期: ${input.birthDate}`);
  }
  const hour = Math.max(0, Math.min(23, Math.floor(input.hour)));

  const bazi = calculateBazi(date, hour);
  const wuxing = calculateWuxing(bazi);
  const tenGods = calculateTenGods(bazi);
  const dayMasterStrength = getDayMasterStrength(bazi, wuxing);
  const dayMasterWuxing = WUXING_TIANGAN[bazi.day.tiangan] ?? '土';
  const shichenName = getShichenName(hour);

  // 占比最高
  const entries = Object.entries(wuxing) as [keyof WuxingStats, number][];
  const dominantKey = [...entries].sort((a, b) => b[1] - a[1])[0][0];
  const dominantElement = WUXING_NAMES.zh[dominantKey];

  const { favorable, unfavorable } = deriveFavorable(dayMasterStrength, dayMasterWuxing, wuxing);

  const cycleYears = input.cycleYears ?? 1;
  const currentYear = new Date().getFullYear();
  const liunianPillars = calculateLiunianPillars(bazi, currentYear, cycleYears);

  return {
    birthDate: input.birthDate,
    gender: input.gender,
    bazi,
    baziString: [
      `${bazi.year.tiangan}${bazi.year.dizhi}`,
      `${bazi.month.tiangan}${bazi.month.dizhi}`,
      `${bazi.day.tiangan}${bazi.day.dizhi}`,
      `${bazi.hour.tiangan}${bazi.hour.dizhi}`,
    ],
    wuxing,
    dayMaster: bazi.day.tiangan,
    dayMasterWuxing,
    dayMasterStrength,
    tenGods,
    shichenName,
    dominantElement,
    favorableElements: favorable,
    unfavorableElements: unfavorable,
    liunianPillars,
  };
}

export { CONSTANTS };
