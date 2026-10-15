// 本地自然语言解析：从用户自由文本中提取推荐条件
// 作为云端 AI 不可用时的回退方案

export interface ChatConditions {
  undergraduateSchool?: string;
  targetMajor?: string;
  totalScore?: number;
  englishScore?: number;
  mathScore?: number;
  cet4Score?: number;
  cet6Score?: number;
  /** 偏好院校层次，如 985 / 211 / 双一流 */
  levelPreferences: string[];
  /** 偏好地区（省市） */
  locationPreferences: string[];
  /** 是否偏好专硕/学硕 */
  majorTypePreference?: '学硕' | '专硕';
}

// 常见专业关键词映射（用于识别用户口语化的专业描述）
// 注意：更具体的专业需排在更泛的专业之前，且关键词避免互相包含
const MAJOR_KEYWORDS: Array<[string, string[]]> = [
  ['软件工程', ['软件工程', '软工', '软件']],
  ['人工智能', ['人工智能', 'ai']],
  ['计算机科学与技术', ['计算机', '计科', 'cs', '计算机科学', '计算机技术']],
  ['电子信息', ['电子信息', '信息工程', '通信工程', '通信', '电子工程', '电子信息工程', '电子']],
  ['机械工程', ['机械工程', '机械']],
  ['土木工程', ['土木工程', '土木']],
  ['金融学', ['金融学', '金融']],
  ['工商管理', ['工商管理', '管理类', '企业管理']],
  ['法学', ['法学', '法律']],
  ['医学', ['临床医学', '医学', '临床']],
  ['教育学', ['教育学', '教育']],
  ['自动化', ['自动化']],
];

// 常见城市关键词（关键词在词中即命中，避免误报）
const CITY_NAMES = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '天津',
  '长沙', '济南', '哈尔滨', '合肥', '沈阳', '长春', '厦门', '大连', '重庆', '青岛',
  '苏州', '郑州', '福州', '兰州', '昆明', '南昌', '南宁', '贵阳', '太原', '海口',
  '银川', '西宁', '石河子', '乌鲁木齐', '拉萨',
];

// 省名映射到常驻城市（用于过滤数据库 location）
const PROVINCE_CITY_MAP: Record<string, string[]> = {
  广东: ['广州', '深圳'],
  江苏: ['南京', '苏州'],
  浙江: ['杭州'],
  湖北: ['武汉'],
  四川: ['成都'],
  陕西: ['西安'],
  湖南: ['长沙'],
  山东: ['济南', '青岛'],
  辽宁: ['沈阳', '大连'],
  福建: ['厦门', '福州'],
  河南: ['郑州'],
  安徽: ['合肥', '中国科学技术大学所在合肥'],
  重庆: ['重庆'],
  上海: ['上海'],
  北京: ['北京'],
  黑龙江: ['哈尔滨'],
  甘肃: ['兰州'],
  天津: ['天津'],
  吉林: ['长春'],
  云南: ['昆明'],
  广西: ['南宁'],
  贵州: ['贵阳'],
  海南: ['海口'],
  宁夏: ['银川'],
  青海: ['西宁'],
  江西: ['南昌'],
  山西: ['太原'],
  新疆: ['乌鲁木齐', '石河子'],
  西藏: ['拉萨'],
};

const LEVEL_KEYWORDS = ['985', '211', '双一流'];

const MAJOR_OFFSET_KEY: Record<string, string> = {
  计算机: '计算机科学与技术',
  软件: '软件工程',
  人工智能: '人工智能',
  电子: '电子信息',
  机械: '机械工程',
  土木: '土木工程',
  金融: '金融学',
  工商管理: '工商管理',
  法学: '法学',
  医学: '医学',
  教育: '教育学',
};

/**
 * 从文本中提取一个分数（数字），校验在范围内
 */
function extractScore(
  text: string,
  patterns: RegExp[],
  min: number,
  max: number,
  strictKeyword?: string
): number | undefined {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    const value = Number(m[1] ?? m[2]);
    // 存在引导关键词要求时，需确保前置关键词命中
    if (strictKeyword) {
      const before = text.slice(Math.max(0, (m.index ?? 0) - 8), m.index ?? 0);
      if (!before.includes(strictKeyword)) {
        // 可能是其他数字误匹配，跳过
        if (!text.includes(strictKeyword)) return undefined;
      }
    }
    if (!Number.isNaN(value) && value >= min && value <= max) {
      return Math.round(value);
    }
  }
  return undefined;
}

/**
 * 从自然语言文本中解析出推荐条件
 */
export function parseUserConditions(rawText: string): ChatConditions {
  const text = rawText.trim();
  const conditions: ChatConditions = {
    levelPreferences: [],
    locationPreferences: [],
  };

  // ---- 总分 ----
  // 1) 优先匹配明确的总分引导词（不含歧义的“考了”）
  const anchored = text.match(
    /(?:总分|初试|总成绩|加起来|一共|总计)\s*[：:为是约]?\s*(\d{3})/
  );
  let totalScore: number | undefined;
  if (anchored) {
    const v = Number(anchored[1]);
    if (v >= 100 && v <= 500) totalScore = v;
  }
  // 2) 无明确引导词时，扫描 “数字+分” 片段，剔除单科前缀，取落在总分区间者
  if (!totalScore) {
    const cands: number[] = [];
    const re = /(\d{3})\s*分/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 6), m.index);
      // 若前面紧跟单科名则跳过
      if (/英语|数学|政治|专业课|复试|英一|英二|数一|数二|数三|科目/.test(before)) continue;
      const v = Number(m[1]);
      if (v >= 100 && v <= 500) cands.push(v);
    }
    if (cands.length) {
      // 取最大的一个作为总分
      totalScore = Math.max(...cands);
    }
  }

  if (totalScore) {
    conditions.totalScore = totalScore;
  }

  // ---- 英语 ----
  const englishScore = extractScore(
    text,
    [/(?:英语|英一|英二|外语)\s*[：:为是考得考了]?\s*(\d{1,3})/, /(\d{1,3})\s*分(?:的英语)/],
    0,
    100,
    '英语'
  );
  if (englishScore) conditions.englishScore = englishScore;

  // ---- 数学 ----
  const mathScore = extractScore(
    text,
    [/(?:数学|数一|数二|数三)\s*[：:为是考得考了]?\s*(\d{1,3})/],
    0,
    150,
    '数学'
  );
  if (mathScore) conditions.mathScore = mathScore;

  // ---- CET4/6 ----
  const cet4 = text.match(/(?:cet-?4|英语四级|四级)\s*[：:为是考了考得]?\s*(\d{1,3})/i);
  if (cet4) {
    const v = Number(cet4[1]);
    if (v >= 425 && v <= 710) conditions.cet4Score = v;
  }
  const cet6 = text.match(/(?:cet-?6|英语六级|六级)\s*[：:为是考了考得]?\s*(\d{1,3})/i);
  if (cet6) {
    const v = Number(cet6[1]);
    if (v >= 425 && v <= 710) conditions.cet6Score = v;
  }

  // ---- 专业 ----
  for (const [majorName, keywords] of MAJOR_KEYWORDS) {
    if (keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
      conditions.targetMajor = majorName;
      break;
    }
  }

  // ---- 本科院校 ----
  // 识别 "本科是xx大学/学院"
  const schoolMatch = text.match(/(?:本科|本科学校|学校|来自|毕业于)\s*(?:是|在|来自)?\s*([\u4e00-\u9fa5]{2,10}(?:大学|学院|学校|大学分校))/);
  if (schoolMatch) {
    conditions.undergraduateSchool = schoolMatch[1];
  }

  // ---- 院校层次偏好 ----
  for (const lvl of LEVEL_KEYWORDS) {
    // 支持 "只要985" "最好是985" "985院校" "想考985"
    if (text.includes(lvl)) {
      conditions.levelPreferences.push(lvl);
    }
  }

  // ---- 地区偏好 ----
  // 城市名直接命中
  for (const city of CITY_NAMES) {
    if (text.includes(city)) {
      conditions.locationPreferences.push(city);
    }
  }
  // 省份名（如 "想在广东"）映射为城市
  for (const [prov, cities] of Object.entries(PROVINCE_CITY_MAP)) {
    if (text.includes(prov)) {
      for (const c of cities) {
        if (!conditions.locationPreferences.includes(c)) {
          conditions.locationPreferences.push(c);
        }
      }
    }
  }

  // ---- 学硕/专硕偏好 ----
  if (text.includes('专硕')) {
    conditions.majorTypePreference = '专硕';
  } else if (text.includes('学硕')) {
    conditions.majorTypePreference = '学硕';
  }

  return conditions;
}

/**
 * 判断文本是否包含足够的关键信息
 */
export function hasEnoughInfo(conditions: ChatConditions): boolean {
  return Boolean(
    conditions.totalScore || // 有分数
      conditions.targetMajor || // 或明确专业
      conditions.levelPreferences.length > 0 || // 或层次偏好
      conditions.locationPreferences.length > 0 // 或地区偏好
  );
}

export function describeConditions(conditions: ChatConditions): string {
  const parts: string[] = [];
  if (conditions.totalScore) parts.push(`模拟总分 ${conditions.totalScore} 分`);
  if (conditions.englishScore) parts.push(`英语 ${conditions.englishScore} 分`);
  if (conditions.mathScore) parts.push(`数学 ${conditions.mathScore} 分`);
  if (conditions.cet4Score) parts.push(`CET-4 ${conditions.cet4Score}`);
  if (conditions.cet6Score) parts.push(`CET-6 ${conditions.cet6Score}`);
  if (conditions.targetMajor) parts.push(`专业：${conditions.targetMajor}`);
  if (conditions.undergraduateSchool) parts.push(`本科：${conditions.undergraduateSchool}`);
  if (conditions.levelPreferences.length) parts.push(`偏好层次：${conditions.levelPreferences.join('/')}`);
  if (conditions.locationPreferences.length) parts.push(`偏好地区：${conditions.locationPreferences.join('/')}`);
  if (conditions.majorTypePreference) parts.push(`偏好学位：${conditions.majorTypePreference}`);
  return parts.length ? parts.join('，') : '未识别到明确条件';
}

export { MAJOR_OFFSET_KEY };
