import type { University } from '../types';
import { getCloudBaseApp, getCurrentSession } from './cloudbase';

// DeepSeek 中转云函数名（已在 CloudBase 部署，DEEPSEEK_API_KEY 存于云函数环境变量）
export const DEEPSEEK_PROXY_FUNCTION = 'deepseekProxy';

export interface CloudAiRecommendResult {
  /** 是否由云端 AI 成功返回 */
  ok: boolean;
  /** 若失败，为错误信息 */
  error?: string;
  /** 云端 AI 生成的推荐院校 */
  universities?: University[];
  /** 云端 AI 生成的文字建议 */
  reply?: string;
}

/** 将 AI 可能返回的下划线/驼峰字段统一成前端驼峰 */
function normalize(raw: Record<string, unknown>): University {
  return {
    id: String(raw.id ?? `${raw.name ?? ''}-${Math.random().toString(36).slice(2, 8)}`),
    name: (raw.name as string) ?? '',
    level: (raw.level as string) ?? '',
    tier: (raw.tier as '冲' | '稳' | '保') ?? '稳',
    majorType: (raw.majorType as '学硕' | '专硕') ?? (raw.major_type as '学硕' | '专硕') ?? '专硕',
    minScore: Number(raw.minScore ?? raw.min_score ?? 0),
    avgScore: Number(raw.avgScore ?? raw.avg_score ?? 0),
    maxScore: Number(raw.maxScore ?? raw.max_score ?? 0),
    admissionRate: Number(raw.admissionRate ?? raw.admission_rate ?? 0),
    location: (raw.location as string) ?? '',
    officialWebsite: (raw.officialWebsite as string) ?? (raw.official_website as string) ?? '',
    description: (raw.description as string) ?? '',
  };
}

/**
 * 通过「DeepSeek 中转云函数」进行院校推荐（真实 DeepSeek API）
 * 要求：用户已登录（云函数侧校验登录态，防止盗刷）。
 * 若未登录 / 云函数异常，返回 ok=false 由调用方兜底。
 */
export async function callCloudAiRecommend(
  userText: string
): Promise<CloudAiRecommendResult> {
  try {
    // 仅登录用户可调用云端 AI
    const { user } = await getCurrentSession();
    if (!user) {
      return { ok: false, error: '未登录，无法调用云端 AI' };
    }

    const app = getCloudBaseApp();
    const res = await app.callFunction({
      name: DEEPSEEK_PROXY_FUNCTION,
      data: { message: userText },
    });

    const result = res?.result as
      | { code?: number; message?: string; data?: { content?: string } | null }
      | undefined;

    if (!result || result.code !== 0 || !result.data?.content) {
      return { ok: false, error: result?.message || '云函数未返回有效结果' };
    }

    const text = (result.data.content || '').trim();
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      return { ok: false, error: '云端 AI 未返回结构化结果' };
    }
    const parsed = JSON.parse(objMatch[0]) as {
      reply?: string;
      universities?: Record<string, unknown>[];
    };
    const unis = (parsed.universities || []).map(normalize).filter((u) => u.name);
    if (!unis.length) {
      return { ok: false, error: '云端 AI 未返回院校数据' };
    }
    return { ok: true, universities: unis, reply: parsed.reply };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
