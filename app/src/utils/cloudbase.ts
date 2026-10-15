import cloudbase from '@cloudbase/js-sdk';

// CloudBase 环境配置
// 环境 ID 可在云开发控制台查看：https://tcb.cloud.tencent.com/dev
export const CLOUDBASE_ENV_ID =
  import.meta.env.VITE_CLOUDBASE_ENV_ID || 'bdw-2g837pfy42fd58ae';

// Publishable Key（公开可发布的 key，仅用于初始化 Web SDK）
// 在 CloudBase 控制台「环境-API Keys」获取
const PUBLISHABLE_KEY = import.meta.env.VITE_CLOUDBASE_PUBLISHABLE_KEY || '';

// 静态托管域名
export const STATIC_HOSTING_DOMAIN = 'bdw-2g837pfy42fd58ae-1404122498.tcloudbaseapp.com';

let appInstance: ReturnType<typeof cloudbase.init> | null = null;

/**
 * 初始化 CloudBase（单例，应用内共享同一个实例）
 * 返回全局共享的 app 实例，避免重复初始化
 */
export function getCloudBaseApp() {
  if (!appInstance) {
    appInstance = cloudbase.init({
      env: CLOUDBASE_ENV_ID,
      accessKey: PUBLISHABLE_KEY || undefined,
      auth: { detectSessionInUrl: true },
    });
  }
  return appInstance;
}

// ==================== 认证 ====================

export interface AuthUser {
  id: string;
  username?: string;
  nickname?: string;
}

/**
 * 获取当前真实登录会话（非匿名）
 * 返回 { session, user }；未登录时 session 为 null
 */
export async function getCurrentSession(): Promise<{
  session: unknown;
  user: AuthUser | null;
}> {
  try {
    const app = getCloudBaseApp();
    const auth = app.auth;
    const { data } = await auth.getSession();
    const session = data?.session;
    if (!session || session.user?.is_anonymous) {
      return { session: null, user: null };
    }
    const u = session.user as {
      id: string;
      is_anonymous?: boolean;
      user_metadata?: {
        username?: string;
        nickName?: string;
        uid?: string;
        name?: string;
      };
    };
    return {
      session,
      user: {
        id: u.id,
        username: u.user_metadata?.username || u.user_metadata?.uid || undefined,
        nickname: u.user_metadata?.nickName || u.user_metadata?.name || undefined,
      },
    };
  } catch (err: unknown) {
    console.warn('读取会话失败:', err);
    return { session: null, user: null };
  }
}

/** 判断当前是否有真实登录会话 */
export async function isLoggedIn(): Promise<boolean> {
  const { user } = await getCurrentSession();
  return Boolean(user);
}

/**
 * 邮箱密码注册
 * 说明：CloudBase Web SDK v3 的 signUp 接受 email 或 phone 作为标识符（不接受 username 字段）。
 * 因此这里统一以 email 字段调用；调用方需确保传入的是邮箱格式字符串。
 */
export async function signUpWithUsername(
  username: string,
  password: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const app = getCloudBaseApp();
    const auth = app.auth;
    const { error } = await auth.signUp({
      email: username,
      password,
    });
    if (error) {
      return { ok: false, message: error.message || String(error) };
    }
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

/** 邮箱密码登录（以 email 字段调用） */
export async function loginWithUsername(
  username: string,
  password: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const app = getCloudBaseApp();
    const auth = app.auth;
    const { error } = await auth.signInWithPassword({ email: username, password });
    if (error) {
      return { ok: false, message: error.message || String(error) };
    }
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

/**
 * 发送手机验证码并返回用于校验的 verifyOtp 回调。
 * 新手机号会自动注册；已有手机号则用于登录。
 * 用法：const { verifyOtp } = await sendPhoneOtp('+861380000000');
 *      const { error } = await verifyOtp({ token: '123456' });
 */
export async function sendPhoneOtp(phone: string): Promise<{
  ok: boolean;
  message?: string;
  verifyOtp?: (args: { token: string }) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
}> {
  try {
    const app = getCloudBaseApp();
    const auth = app.auth;
    const { data, error } = await auth.signInWithOtp({ phone });
    if (error) {
      return { ok: false, message: error.message || String(error) };
    }
    const verifyOtp = data?.verifyOtp;
    if (typeof verifyOtp !== 'function') {
      return { ok: false, message: '未能获取验证码校验句柄（可能需先完成注册流程）' };
    }
    return { ok: true, verifyOtp };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

/** 登出 */
export async function logout(): Promise<void> {
  try {
    const app = getCloudBaseApp();
    await app.auth.signOut();
  } catch (err: unknown) {
    console.warn('登出失败:', err);
  }
}

// ==================== 数据库 ====================

/**
 * 获取数据库引用（惰性初始化）
 * 仅在真实登录会话下用于 NoSQL 读写
 */
export function getDatabase() {
  const app = getCloudBaseApp();
  return app.database();
}

/**
 * 测试 CloudBase 连接状态（公开探测：仅初始化 + 轻量网络连通）
 * 返回 { connected, detail }
 */
export async function checkCloudBaseConnection(): Promise<{
  connected: boolean;
  detail: string;
}> {
  try {
    const app = getCloudBaseApp();
    await app.auth.getSession();
    return { connected: true, detail: 'CloudBase 连接正常' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, detail: msg };
  }
}

export type CloudSyncState = 'online' | 'offline' | 'unknown';

export interface RecommendationRecord {
  _id?: string;
  undergraduateSchool: string;
  targetMajor: string;
  totalScore: number;
  englishScore: number;
  mathScore: number;
  cet4Score?: number;
  cet6Score?: number;
  universities: unknown[];
  createdAt: Date;
}

/**
 * 将一条推荐记录保存到 CloudBase recommendations 集合
 * 仅登录用户可写（依赖集合安全规则 _openid）；未登录返回 null
 */
export async function saveRecommendationRecord(
  record: Omit<RecommendationRecord, '_id' | 'createdAt'> & { createdAt?: Date }
): Promise<string | null> {
  const { user } = await getCurrentSession();
  if (!user) {
    return null;
  }
  try {
    const db = getDatabase();
    const result = await db.collection('recommendations').add({
      ...record,
      createdAt: record.createdAt || new Date(),
    });
    return (result as { _id?: string })._id ?? null;
  } catch (err: unknown) {
    console.warn('保存推荐记录失败:', err);
    return null;
  }
}

/**
 * 查询当前登录用户的推荐历史（按时间倒序，最多 limit 条）
 */
export async function fetchRecommendationHistory(limit = 20): Promise<RecommendationRecord[]> {
  const { user } = await getCurrentSession();
  if (!user) {
    return [];
  }
  try {
    const db = getDatabase();
    const res = await db
      .collection('recommendations')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return (res.data as unknown as RecommendationRecord[]) || [];
  } catch (err: unknown) {
    console.warn('读取推荐历史失败:', err);
    return [];
  }
}
