/**
 * 命理核心算法 - 八字计算
 * Quantum Fate Lite · 轻量化版本
 * 基于天干地支、五行生克、十神关系
 * 来源：复用 quantum-fate/src/lib/bazi/index.ts
 */

// 天干
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
// 地支
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 五行归属
const WUXING_TIANGAN: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

const WUXING_DIZHI: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 十神关系
const TEN_GODS: Record<string, Record<string, string>> = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '偏财', '己': '正财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
  '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' }
};

// 十二时辰
const SHICHEN_HOURS: Record<number, [number, number]> = {
  1: [23, 1], 2: [1, 3], 3: [3, 5], 4: [5, 7], 5: [7, 9], 6: [9, 11],
  7: [11, 13], 8: [13, 15], 9: [15, 17], 10: [17, 19], 11: [19, 21], 12: [21, 23]
};

// 五行（生克顺序）
const WUXING_SHENGKE = {
  sheng: ['木生火', '火生土', '土生金', '金生水', '水生木'] as const,
  ke: ['木克土', '土克水', '水克火', '火克金', '金克木'] as const,
};

// ==================== 类型定义 ====================

export interface Bazi {
  year: { tiangan: string; dizhi: string };
  month: { tiangan: string; dizhi: string };
  day: { tiangan: string; dizhi: string };
  hour: { tiangan: string; dizhi: string };
}

export interface LiunianPillar {
  year: number;
  tiangan: string;
  dizhi: string;
  wuxing: string;
  interactions: LiunianInteraction[];
}

export interface LiunianInteraction {
  type: 'chong' | 'he' | 'sheng' | 'ke';
  target: string;
  targetPillar: string;
  description: string;
}

export interface WuxingStats {
  wood: number; fire: number; earth: number; metal: number; water: number;
}

export interface TenGodsStats {
  bimaj: number; jiecai: number; shishen: number; shangguan: number;
  piancai: number; zhengcai: number; qisha: number; zhengguan: number;
  pianyin: number; zhengyin: number;
}

// ==================== 内部计算函数 ====================

function getTiangangIndex(year: number): number {
  return ((year - 1900) + 4) % 10;
}

function getDizhiIndex(year: number): number {
  return (year - 1900) % 12;
}

function getMonthTiangang(yearTiangang: number, month: number): number {
  // 年上起月法
  const startTable: Record<number, number> = {
    0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6,
    3: 8, 8: 8, 4: 0, 9: 0
  };
  const start = startTable[yearTiangang] ?? 2;
  return (start + month - 1) % 10;
}

function toJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getWuxingKey(wuxing: string): keyof WuxingStats {
  const map: Record<string, keyof WuxingStats> = {
    '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water'
  };
  return map[wuxing] ?? 'earth';
}

function getTenGodKey(name: string): keyof TenGodsStats | null {
  const map: Record<string, keyof TenGodsStats> = {
    '比肩': 'bimaj', '劫财': 'jiecai', '食神': 'shishen', '伤官': 'shangguan',
    '偏财': 'piancai', '正财': 'zhengcai', '七杀': 'qisha', '正官': 'zhengguan',
    '偏印': 'pianyin', '正印': 'zhengyin'
  };
  return map[name] ?? null;
}

// ==================== 核心 API ====================

/**
 * 计算八字四柱
 */
export function calculateBazi(birthDate: Date, hour: number): Bazi {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  const yearTianIdx = getTiangangIndex(year);
  const yearDiIdx = getDizhiIndex(year);
  const monthTianIdx = getMonthTiangang(yearTianIdx, month);
  const monthDiIdx = (month - 1) % 12;
  const julianDay = toJulianDay(new Date(year, month - 1, day));
  const dayTianIdx = (julianDay + 4) % 10;
  const dayDiIdx = julianDay % 12;
  const hourDiIdx = Math.floor(((hour + 1) % 24) / 2);
  const hourTianStart = (dayTianIdx % 5) * 2;
  const hourTianIdx = (hourTianStart + hourDiIdx) % 10;

  return {
    year: { tiangan: TIANGAN[yearTianIdx], dizhi: DIZHI[yearDiIdx] },
    month: { tiangan: TIANGAN[monthTianIdx], dizhi: DIZHI[monthDiIdx] },
    day: { tiangan: TIANGAN[dayTianIdx], dizhi: DIZHI[dayDiIdx] },
    hour: { tiangan: TIANGAN[hourTianIdx], dizhi: DIZHI[hourDiIdx] }
  };
}

/**
 * 计算五行分布（归一化为百分比）
 */
export function calculateWuxing(bazi: Bazi): WuxingStats {
  const stats: WuxingStats = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    stats[getWuxingKey(WUXING_TIANGAN[pillar.tiangan] ?? '土')]++;
  }
  for (const pillar of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    const wuxing = WUXING_DIZHI[pillar.dizhi] ?? '土';
    stats[getWuxingKey(wuxing)]++;
  }
  const total = stats.wood + stats.fire + stats.earth + stats.metal + stats.water;
  return {
    wood: Math.round((stats.wood / total) * 100),
    fire: Math.round((stats.fire / total) * 100),
    earth: Math.round((stats.earth / total) * 100),
    metal: Math.round((stats.metal / total) * 100),
    water: Math.round((stats.water / total) * 100),
  };
}

/**
 * 判断日主旺衰
 * 考虑全局生扶力量：印（生我）+ 比劫（同我）的总占比
 */
export function getDayMasterStrength(
  bazi: Bazi,
  wuxing: WuxingStats
): 'strong' | 'weak' | 'neutral' {
  const dayMaster = bazi.day.tiangan;
  const dayWuxing = WUXING_TIANGAN[dayMaster] ?? '土';
  const dayKey = getWuxingKey(dayWuxing);

  const shengMap: Record<string, keyof WuxingStats> = {
    '木': 'water', '火': 'wood', '土': 'fire', '金': 'earth', '水': 'metal',
  };
  const shengKey = shengMap[dayWuxing] ?? 'earth';

  const selfAndSupport = wuxing[dayKey] + wuxing[shengKey];
  if (selfAndSupport >= 45) return 'strong';
  if (selfAndSupport <= 20) return 'weak';
  return 'neutral';
}

/**
 * 计算十神（基于日主）
 */
export function calculateTenGods(bazi: Bazi): TenGodsStats {
  const stats: TenGodsStats = {
    bimaj: 0, jiecai: 0, shishen: 0, shangguan: 0,
    piancai: 0, zhengcai: 0, qisha: 0, zhengguan: 0,
    pianyin: 0, zhengyin: 0
  };
  const dayMaster = bazi.day.tiangan;
  const tenGodsMap = TEN_GODS[dayMaster];
  if (!tenGodsMap) return stats;
  for (const pillar of [bazi.year, bazi.month, bazi.hour]) {
    const tenGod = tenGodsMap[pillar.tiangan];
    if (!tenGod) continue;
    const key = getTenGodKey(tenGod);
    if (key) stats[key]++;
  }
  return stats;
}

/**
 * 获取时辰名称（如 "子时"）
 */
export function getShichenName(hour: number): string {
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return DIZHI[idx] + '时';
}

/**
 * 随机生成时辰（1-12）
 */
export function randomHour(): number {
  return Math.floor(Math.random() * 12) + 1;
}

/**
 * 五行中英文名映射
 */
export const WUXING_NAMES = {
  zh: { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' } as const,
  en: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' } as const,
};

/**
 * 十神中英文名
 */
export const TEN_GODS_NAMES = {
  zh: {
    bimaj: '比肩', jiecai: '劫财', shishen: '食神', shangguan: '伤官',
    piancai: '偏财', zhengcai: '正财', qisha: '七杀', zhengguan: '正官',
    pianyin: '偏印', zhengyin: '正印'
  } as const,
  en: {
    bimaj: 'Friend', jiecai: 'Rob Wealth', shishen: 'Eating God', shangguan: 'Hurting Officer',
    piancai: 'Indirect Wealth', zhengcai: 'Direct Wealth', qisha: 'Seven Killings', zhengguan: 'Direct Officer',
    pianyin: 'Indirect Seal', zhengyin: 'Direct Seal'
  } as const,
};

/**
 * 找出最旺和最弱的五行（用于推荐匹配）
 */
export function findWuxingExtremes(wuxing: WuxingStats): {
  strongest: keyof WuxingStats;
  weakest: keyof WuxingStats;
} {
  const entries = Object.entries(wuxing) as [keyof WuxingStats, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  return { strongest: sorted[0][0], weakest: sorted[sorted.length - 1][0] };
}

const LIUHE_DIZHI: Record<string, string> = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午',
};

const LIUCHONG_DIZHI: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

export function calculateLiunianPillars(
  bazi: Bazi,
  startYear: number,
  numYears: number
): LiunianPillar[] {
  const result: LiunianPillar[] = [];

  for (let i = 0; i < numYears; i++) {
    const year = startYear + i;
    const tianIdx = getTiangangIndex(year);
    const diIdx = getDizhiIndex(year);
    const tiangan = TIANGAN[tianIdx];
    const dizhi = DIZHI[diIdx];
    const wuxing = WUXING_TIANGAN[tiangan] ?? '土';

    const interactions: LiunianInteraction[] = [];

    for (const [label, pillar] of [['年', bazi.year], ['月', bazi.month], ['日', bazi.day]] as [string, { tiangan: string; dizhi: string }][]
    ) {
      if (dizhi === LIUCHONG_DIZHI[pillar.dizhi]) {
        interactions.push({
          type: 'chong',
          target: pillar.dizhi,
          targetPillar: label + '柱',
          description: `${dizhi}${pillar.dizhi}相冲(${label}柱)`,
        });
      }
      if (dizhi === LIUHE_DIZHI[pillar.dizhi]) {
        interactions.push({
          type: 'he',
          target: pillar.dizhi,
          targetPillar: label + '柱',
          description: `${dizhi}${pillar.dizhi}相合(${label}柱)`,
        });
      }

      const lnWuxing = WUXING_TIANGAN[tiangan] ?? '土';
      const pWuxing = WUXING_TIANGAN[pillar.tiangan] ?? '土';
      if (wuxingShengs(lnWuxing, pWuxing)) {
        interactions.push({
          type: 'sheng',
          target: pillar.tiangan,
          targetPillar: label + '柱天干',
          description: `${lnWuxing}生${pWuxing}(${label}柱天干)`,
        });
      }
      if (wuxingKes(lnWuxing, pWuxing)) {
        interactions.push({
          type: 'ke',
          target: pillar.tiangan,
          targetPillar: label + '柱天干',
          description: `${lnWuxing}克${pWuxing}(${label}柱天干)`,
        });
      }
    }

    result.push({ year, tiangan, dizhi, wuxing, interactions });
  }
  return result;
}

function wuxingShengs(a: string, b: string): boolean {
  return WUXING_SHENGKE.sheng.some((s) => s.startsWith(a) && s.endsWith(b));
}

function wuxingKes(a: string, b: string): boolean {
  return WUXING_SHENGKE.ke.some((s) => s.startsWith(a) && s.endsWith(b));
}

// 导出常量供 AI 生成 prompt 使用
export const CONSTANTS = {
  TIANGAN, DIZHI, TEN_GODS, WUXING_TIANGAN, WUXING_DIZHI, SHICHEN_HOURS,
  WUXING_SHENGKE, WUXING_NAMES, TEN_GODS_NAMES,
};
