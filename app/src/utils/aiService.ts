import type { University } from '../types';
import {
  parseUserConditions,
  hasEnoughInfo,
  describeConditions,
  type ChatConditions,
} from './nlp';
import { recommendByConditions, conditionsToUserData } from './aiRecommend';
import { generateRecommendations } from './recommendation';
import { callCloudAiRecommend } from './cloudAi';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  /** 本轮解析出的条件（若用户提供了足够信息） */
  conditions?: ChatConditions;
  /** 是否给出了可查看的推荐结果 */
  hasRecommendation?: boolean;
  /** 回复来源：cloud=云端 AI，local=本地智能解析 */
  source?: 'cloud' | 'local';
}

export interface AiChatResult {
  /** 对话窗口展示的文本回复 */
  reply: string;
  /** 解析出的条件 */
  conditions: ChatConditions;
  /** 是否建议用户“查看推荐” */
  hasRecommendation: boolean;
  /** 若生成，则为推荐院校 */
  universities?: University[];
  userData?: ReturnType<typeof conditionsToUserData>;
  /** 本次使用的引擎来源 */
  source: 'cloud' | 'local';
}

/** 客服/引导式开场白 */
export function welcomeMessage(): string {
  return (
    '你好呀！我是你的智能择校助手 🤖\n\n' +
    '你可以在下面的对话框里，用一句话描述你的情况，例如：\n' +
    '「我是计算机专业的，想考985，模拟总分360，英语75，想去北京或上海」\n\n' +
    '也可以直接说「总分380 电子专业 想去成都」这类简短信息。' +
    '我会帮你生成「冲、稳、保」三个档位的院校推荐。'
  );
}

/** 检测用户输入是否是简单的问候/闲聊 */
function isSmallTalk(text: string): boolean {
  const t = text.trim().toLowerCase();
  const greetings = ['你好', '您好', 'hello', 'hi', '在吗', '哈喽', '开始', '介绍', '帮助', 'help'];
  return greetings.includes(t) || /^(你好|您好|hello|hi|在吗)[，。!！?？\s]*$/.test(t);
}

/**
 * 处理一轮 AI 对话：
 * 1) 优先调用云端 hy3 模型（需 Token Credits 资源包 + 真实登录会话），失败自动回退
 * 2) 回退时用本地解析引擎从文本提取条件并生成冲稳保推荐
 */
export async function processAiMessage(userText: string): Promise<AiChatResult> {
  // 问候语
  if (isSmallTalk(userText)) {
    return {
      reply: welcomeMessage(),
      conditions: { levelPreferences: [], locationPreferences: [] },
      hasRecommendation: false,
      source: 'local',
    };
  }

  // 用户明确想重置/清空
  if (/重新|清空|换个|再来/.test(userText)) {
    return {
      reply: '好的，已为你清空条件。请重新描述你的情况吧～',
      conditions: { levelPreferences: [], locationPreferences: [] },
      hasRecommendation: false,
      source: 'local',
    };
  }

  // 先尝试云端 AI（hy3）——失败/未就绪则由本地解析兜底
  const cloud = await callCloudAiRecommend(userText);
  if (cloud.ok && cloud.universities && cloud.universities.length) {
    const unis = cloud.universities;
    const summary = describeConditions(parseUserConditions(userText));
    const chong = unis.filter((u) => u.tier === '冲').length;
    const wen = unis.filter((u) => u.tier === '稳').length;
    const bao = unis.filter((u) => u.tier === '保').length;
    const base = cloud.reply
      ? `${cloud.reply}\n\n`
      : `我已经根据你的描述为你整理了择校建议 👇\n\n`;
    const reply =
      `${base}` +
      `📋 综合信息：${summary}\n\n` +
      `🎯 共推荐 ${unis.length} 所院校（冲 ${chong} 所 / 稳 ${wen} 所 / 保 ${bao} 所）\n\n` +
      `点击下方「查看推荐院校」即可查看完整名单。`;
    return {
      reply,
      conditions: parseUserConditions(userText),
      hasRecommendation: true,
      universities: unis,
      userData: conditionsToUserData(parseUserConditions(userText)),
      source: 'cloud',
    };
  }

  // ---- 云端不可用：本地解析兜底 ----
  const conditions = parseUserConditions(userText);

  // 信息不足，追问
  if (!hasEnoughInfo(conditions)) {
    return {
      reply:
        '我暂时没能从你的描述里提取到足够的信息。\n\n' +
        '请补充以下任意一项：\n' +
        '• 模拟总分，例如「总分 360」\n' +
        '• 目标专业，例如「软件工程」\n' +
        '• 院校层次偏好，例如「只要 985」\n' +
        '• 地区偏好，例如「想去江浙沪」',
      conditions,
      hasRecommendation: false,
      source: 'local',
    };
  }

  // 条件充分：生成推荐
  let universities = recommendByConditions(conditions);
  if (!universities.length) {
    universities = generateRecommendations(conditionsToUserData(conditions));
  }
  const hasRec = universities.length > 0;

  const summary = describeConditions(conditions);
  const count = universities.length;
  const chong = universities.filter((u) => u.tier === '冲').length;
  const wen = universities.filter((u) => u.tier === '稳').length;
  const bao = universities.filter((u) => u.tier === '保').length;

  const reply =
    `我已经根据你的描述整理了择校建议 👇\n\n` +
    `📋 识别到的信息：${summary}\n\n` +
    `🎯 共为你匹配 ${count} 所院校（冲 ${chong} 所 / 稳 ${wen} 所 / 保 ${bao} 所）\n\n` +
    `点击下方「查看推荐院校」即可查看完整名单，可在此继续补充偏好（如地区、层次）让我帮你细调。`;

  return {
    reply,
    conditions,
    hasRecommendation: hasRec,
    universities,
    userData: conditionsToUserData(conditions),
    source: 'local',
  };
}
