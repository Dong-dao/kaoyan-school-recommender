import type { UserData, University } from './types';

// 后端 API 基础地址
// 开发环境：Django 运行在 http://localhost:8000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface RecommendResponse {
  success: boolean;
  source: string;
  user_input: UserData;
  universities: University[];
  record_id?: number;
}

// 将前端的驼峰命名转换为后端期望的下划线命名
function toBackendPayload(data: UserData): Record<string, unknown> {
  return {
    undergraduate_school: data.undergraduateSchool,
    target_major: data.targetMajor,
    english_score: data.englishScore,
    math_score: data.mathScore,
    total_score: data.totalScore,
    cet4_score: data.cet4Score,
    cet6_score: data.cet6Score,
  };
}

// 兼容后端/Deepseek 可能返回的下划线或驼峰命名，统一转成前端的驼峰
function normalizeUniversity(raw: any): University {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    level: raw.level ?? '',
    tier: raw.tier ?? '稳',
    majorType: raw.majorType ?? raw.major_type ?? '专硕',
    minScore: raw.minScore ?? raw.min_score ?? 0,
    avgScore: raw.avgScore ?? raw.avg_score ?? 0,
    maxScore: raw.maxScore ?? raw.max_score ?? 0,
    admissionRate: raw.admissionRate ?? raw.admission_rate ?? 0,
    location: raw.location ?? '',
    officialWebsite: raw.officialWebsite ?? raw.official_website ?? '',
    description: raw.description ?? '',
  };
}

/**
 * 调用后端推荐接口
 * 后端会优先调用 Deepseek 大模型，未配置时降级为本地算法
 */
export async function fetchRecommendations(data: UserData): Promise<University[]> {
  const response = await fetch(`${API_BASE_URL}/recommend/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toBackendPayload(data)),
  });

  if (!response.ok) {
    let errorMsg = `推荐请求失败 (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      const raw = errorData.detail || errorData.error;
      if (typeof raw === 'string') {
        errorMsg = raw;
      } else if (Array.isArray(raw)) {
        // DRF 字段校验错误：[{field: [...]}]
        errorMsg = raw.map((e: any) => `${Object.keys(e)[0]}: ${Object.values(e)[0]}`).join('；');
      } else if (raw && typeof raw === 'object') {
        // DRF 字段校验错误：{field: ["msg"]}
        errorMsg = Object.entries(raw)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
          .join('；');
      }
    } catch {
      // 响应不是 JSON
    }
    throw new Error(errorMsg);
  }

  const result: RecommendResponse = await response.json();
  return (result.universities || []).map(normalizeUniversity);
}

/**
 * 健康检查：确认后端是否可访问
 */
export async function checkBackendHealth(): Promise<{ status: string; deepseek_configured: boolean }> {
  const response = await fetch(`${API_BASE_URL}/health/`);
  if (!response.ok) {
    throw new Error('无法连接后端服务');
  }
  return response.json();
}

