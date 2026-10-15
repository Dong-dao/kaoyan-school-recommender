import type { University, UserData } from '../types';
import { universityDatabase, majorScoreOffset } from '../data/universities';
import type { ChatConditions } from './nlp';
import { generateRecommendations } from './recommendation';

// 把解析出的条件转成标准 UserData（供已有卡片/逻辑使用）
export function conditionsToUserData(conditions: ChatConditions): UserData {
  return {
    undergraduateSchool: conditions.undergraduateSchool || '',
    targetMajor: conditions.targetMajor || '',
    englishScore: conditions.englishScore || 0,
    mathScore: conditions.mathScore || 0,
    totalScore: conditions.totalScore || 0,
    cet4Score: conditions.cet4Score,
    cet6Score: conditions.cet6Score,
  };
}

interface RankedUni {
  u: (typeof universityDatabase)[number];
  adjustedAvg: number;
  dist: number;
}

/**
 * 根据解析出的条件（层次/地区/学位偏好）对院校库进行过滤，
 * 再按分数离用户总分最近的方式分档为 冲/稳/保。
 */
export function recommendByConditions(conditions: ChatConditions): University[] {
  const score = conditions.totalScore;
  if (!score || score <= 0) {
    // 无明确分数时退化为按层次/地区偏好取一批院校并分档（分数参照其自身）
    return recommendWithoutScore(conditions);
  }

  const major = conditions.targetMajor || '';
  const offset = majorScoreOffset[major] ?? 0;

  // 过滤
  const pool = universityDatabase.filter((u) => {
    if (conditions.levelPreferences.length > 0) {
      const ok = conditions.levelPreferences.some((lv) => u.level.includes(lv));
      if (!ok) return false;
    }
    if (conditions.locationPreferences.length > 0) {
      const ok = conditions.locationPreferences.some((loc) => u.location.includes(loc));
      if (!ok) return false;
    }
    if (conditions.majorTypePreference && u.majorType !== conditions.majorTypePreference) {
      return false;
    }
    return true;
  });

  if (pool.length === 0) {
    // 过滤后无结果，回退到全量
    return generateRecommendations(conditionsToUserData(conditions));
  }

  const ranked: RankedUni[] = pool.map((u) => ({
    u,
    adjustedAvg: u.avgScore + offset,
    dist: 0,
  }));
  ranked.forEach((r) => {
    r.dist = r.adjustedAvg - score;
  });

  const chong = ranked.filter((r) => r.dist >= 2 && r.dist <= 25);
  const wen = ranked.filter((r) => r.dist >= -8 && r.dist <= 8);
  const bao = ranked.filter((r) => r.dist <= -2 && r.dist >= -35);

  const pick = (arr: RankedUni[], n: number): RankedUni[] =>
    [...arr].sort((a, b) => Math.abs(a.dist) - Math.abs(b.dist)).slice(0, n);

  const chongList = pick(chong, 4).length ? pick(chong, 4) : pick(ranked.filter((r) => r.dist > 0), 3);
  const wenList = pick(wen, 4).length ? pick(wen, 4) : pick(ranked, 3);
  const baoList = pick(bao, 4).length ? pick(bao, 4) : pick(ranked.filter((r) => r.dist < 0), 3);

  // 去重
  const seen = new Set<string>();
  const result: University[] = [];
  const push = (list: RankedUni[], tier: '冲' | '稳' | '保') => {
    for (const { u } of list) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      result.push({ ...u, tier });
    }
  };

  push(chongList, '冲');
  push(wenList, '稳');
  push(baoList, '保');

  return result;
}

/** 无总分时：按层次/地区过滤后，按录取分从高到低粗分档位展示 */
function recommendWithoutScore(conditions: ChatConditions): University[] {
  const pool = universityDatabase.filter((u) => {
    if (conditions.levelPreferences.length > 0) {
      const ok = conditions.levelPreferences.some((lv) => u.level.includes(lv));
      if (!ok) return false;
    }
    if (conditions.locationPreferences.length > 0) {
      const ok = conditions.locationPreferences.some((loc) => u.location.includes(loc));
      if (!ok) return false;
    }
    if (conditions.majorTypePreference && u.majorType !== conditions.majorTypePreference) {
      return false;
    }
    return true;
  });
  const effective = pool.length ? pool : universityDatabase;
  const sorted = [...effective].sort((a, b) => b.avgScore - a.avgScore);
  const chunk = Math.ceil(sorted.length / 3) || 1;
  const seen = new Set<string>();
  const result: University[] = [];
  const tiers: Array<'冲' | '稳' | '保'> = ['冲', '稳', '保'];
  tiers.forEach((tier, i) => {
    const seg = sorted.slice(i * chunk, i * chunk + chunk);
    seg.slice(0, 5).forEach((u) => {
      if (seen.has(u.id)) return;
      seen.add(u.id);
      result.push({ ...u, tier });
    });
  });
  return result;
}
