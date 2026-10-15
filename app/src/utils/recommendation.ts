import type { UserData, University } from '../types';
import { universityDatabase, majorScoreOffset } from '../data/universities';

// 冲稳保推荐算法
// 核心逻辑：根据用户模拟总分，筛选出录取分数线在"冲""稳""保"三个档位的院校
// 分数段划分：
//   - 冲：录取平均分比用户分数高 5~25 分
//   - 稳：录取平均分在用户分数 ±5 分内
//   - 保：录取平均分比用户分数低 10~30 分

export function generateRecommendations(data: UserData): University[] {
  const userScore = data.totalScore;
  const majorOffset = majorScoreOffset[data.targetMajor] || 0;

  // 根据专业调整各院校的有效分数线
  const adjustedUniversities = universityDatabase.map((u) => ({
    ...u,
    adjustedMin: u.minScore + majorOffset,
    adjustedAvg: u.avgScore + majorOffset,
  }));

  const results: University[] = [];

  // 冲一冲：录取平均分比用户分数高 5~25 分
  const chongPool = adjustedUniversities.filter(
    (u) => u.adjustedAvg - userScore >= 5 && u.adjustedAvg - userScore <= 25
  );
  results.push(...assignTier(chongPool, '冲', userScore));

  // 稳一稳：录取平均分在用户分数 ±5 分内
  const wenPool = adjustedUniversities.filter(
    (u) => Math.abs(u.adjustedAvg - userScore) <= 5
  );
  results.push(...assignTier(wenPool, '稳', userScore));

  // 保一保：录取平均分比用户分数低 10~30 分
  const baoPool = adjustedUniversities.filter(
    (u) => userScore - u.adjustedAvg >= 10 && userScore - u.adjustedAvg <= 30
  );
  results.push(...assignTier(baoPool, '保', userScore));

  // 如果某个档位为空（例如分数太高或太低），动态扩展范围
  const fillTiers = fillEmptyTiers(results, adjustedUniversities, userScore);

  return fillTiers;
}

function assignTier(
  pool: Array<{ id: string; name: string; level: string; majorType: '学硕' | '专硕' | '专业组'; minScore: number; avgScore: number; maxScore: number; admissionRate: number; location: string; officialWebsite: string; description?: string; adjustedMin: number; adjustedAvg: number }>,
  tier: '冲' | '稳' | '保',
  _userScore: number
): University[] {
  // 按录取平均分排序，每个档位取 4 所，均匀覆盖不同分数段
  const sorted = [...pool].sort((a, b) => a.adjustedAvg - b.adjustedAvg);
  const selected = sorted.slice(0, 4);

  return selected.map((u) => ({
    id: u.id,
    name: u.name,
    level: u.level,
    majorType: u.majorType,
    tier,
    minScore: u.minScore,
    avgScore: u.avgScore,
    maxScore: u.maxScore,
    admissionRate: u.admissionRate,
    location: u.location,
    officialWebsite: u.officialWebsite,
    description: u.description,
  }));
}

function fillEmptyTiers(
  results: University[],
  pool: Array<{ id: string; name: string; level: string; majorType: '学硕' | '专硕' | '专业组'; minScore: number; avgScore: number; maxScore: number; admissionRate: number; location: string; officialWebsite: string; description?: string; adjustedMin: number; adjustedAvg: number }>,
  userScore: number
): University[] {
  const existingIds = new Set(results.map((r) => r.id));
  const tiers: Array<'冲' | '稳' | '保'> = ['冲', '稳', '保'];
  const filled = [...results];

  tiers.forEach((tier) => {
    if (!filled.some((r) => r.tier === tier)) {
      // 该档位为空，从最近的分数区间补充
      let closest: University[] = [];
      if (tier === '冲') {
        closest = pool
          .filter((u) => u.adjustedAvg > userScore)
          .sort((a, b) => a.adjustedAvg - b.adjustedAvg)
          .slice(0, 3)
          .map((u) => ({ ...u, tier, minScore: u.minScore, avgScore: u.avgScore, maxScore: u.maxScore }));
      } else if (tier === '稳') {
        closest = pool
          .sort((a, b) => Math.abs(a.adjustedAvg - userScore) - Math.abs(b.adjustedAvg - userScore))
          .slice(0, 3)
          .map((u) => ({ ...u, tier, minScore: u.minScore, avgScore: u.avgScore, maxScore: u.maxScore }));
      } else {
        closest = pool
          .filter((u) => u.adjustedAvg < userScore)
          .sort((a, b) => b.adjustedAvg - a.adjustedAvg)
          .slice(0, 3)
          .map((u) => ({ ...u, tier, minScore: u.minScore, avgScore: u.avgScore, maxScore: u.maxScore }));
      }
      closest.forEach((u) => {
        if (!existingIds.has(u.id)) {
          existingIds.add(u.id);
          filled.push(u);
        }
      });
    }
  });

  return filled;
}