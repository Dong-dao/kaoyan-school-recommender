// DeepSeek 中转云函数（Event Function）
// 用途：前端登录用户通过 app.callFunction({ name: 'deepseekProxy', data }) 调用
// 本函数持有 DEEPSEEK_API_KEY 环境变量，代为调用 DeepSeek 官方 API，避免 Key 暴露在前端。
// 支持两种 action：
//   action = 'chat'   （默认）对话式推荐，返回结构化院校 JSON
//   action = 'report' 生成完整分析报告（Markdown 文本），入参 userData + universities
// 部署时需配置环境变量：DEEPSEEK_API_KEY=<用户自己的 sk-xxx>
const https = require('https');

// 允许的方法与基础配置
const DEEPSEEK_BASE = 'api.deepseek.com';
const DEEPSEEK_PATH = '/chat/completions';

function callDeepSeek(messages, maxTokens = 2048) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('服务端未配置 DEEPSEEK_API_KEY'));
  }

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: DEEPSEEK_BASE,
        path: DEEPSEEK_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 60000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`DeepSeek API 错误 ${res.statusCode}: ${parsed?.error?.message || data}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`DeepSeek API 返回解析失败: ${e.message}`));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('DeepSeek API 请求超时'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 组装择校推荐 prompt，要求返回结构化 JSON
function buildPrompt(userText) {
  return (
    '你是一位资深的考研院校志愿填报专家。用户会用一句或多句话描述自己的情况（可能包含模拟总分、目标专业、本科院校、英语数学等分数、偏好城市、偏好985/211层次、偏好学硕或专硕等，信息可能不全，缺项就留空）。\n\n' +
    '请完成两件事，并严格用如下 JSON 对象返回（不要输出 JSON 之外的任何文字、注释或 Markdown 代码块）：\n' +
    '{\n' +
    '  "reply": "给用户的一段友好、专业的文字回复（200字以内），复述你理解的用户情况并给出择校思路",\n' +
    '  "universities": [\n' +
    '    {\n' +
    '      "name": "院校全名",\n' +
    '      "level": "985/211/双一流/省属重点",\n' +
    '      "tier": "冲 或 稳 或 保",\n' +
    '      "majorType": "学硕 或 专硕 或 专业组",\n' +
    '      "minScore": 最低录取分数字,\n' +
    '      "avgScore": 平均录取分数字,\n' +
    '      "maxScore": 最高录取分数字,\n' +
    '      "admissionRate": 录取率数字(如 30 表示 30%),\n' +
    '      "location": "城市",\n' +
    '      "officialWebsite": "院校研究生招生官网url",\n' +
    '      "description": "一句话介绍该校特点"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    '要求：推荐真实存在且符合用户分数与偏好的院校；覆盖冲/稳/保三档；每档 1-3 所，总计 3-9 所；' +
    '若信息不足无法判断档位，也依据专业/城市给出合理院校。\n\n' +
    '用户输入：' +
    userText
  );
}

// 组装“完整分析报告”的 prompt：基于用户信息 + 已推荐院校，生成 Markdown 报告
function buildReportPrompt(userData, universities) {
  const u = userData || {};
  const unis = Array.isArray(universities) ? universities : [];

  const userInfo =
    '考生情况：\n' +
    `- 本科院校：${u.undergraduateSchool || '未知'}\n` +
    `- 目标专业：${u.targetMajor || '未知'}\n` +
    `- 模拟总分：${u.totalScore != null ? u.totalScore + ' 分' : '未知'}\n` +
    `- 英语：${u.englishScore != null ? u.englishScore + ' 分' : '未知'}\n` +
    `- 数学：${u.mathScore != null ? u.mathScore + ' 分' : '未知'}\n` +
    (u.cet4Score ? `- CET-4：${u.cet4Score}\n` : '') +
    (u.cet6Score ? `- CET-6：${u.cet6Score}\n` : '');

  const uniList = unis
    .map(
      (x, i) =>
        `${i + 1}. ${x.name}（${x.tier}档｜${x.level}｜${x.majorType}）最低${x.minScore}/平均${x.avgScore}/最高${x.maxScore}分，录取率约${x.admissionRate}%，${x.location}，官网 ${x.officialWebsite}。简介：${x.description || ''}`
    )
    .join('\n');

  return (
    '你是一位资深的考研院校志愿填报专家。请基于以下考生情况和推荐院校，生成一份**详尽、专业、可读性高**的《考研院校推荐分析报告》，使用 Markdown 编写（标题用 #/##，正文条理清晰）。\n\n' +
    `${userInfo}\n` +
    '已推荐院校清单：\n' +
    `${uniList || '（无）'}\n\n` +
    '报告需包含以下章节：\n' +
    '# 一、考生情况概览（表格形式：总分、各科、四六级）\n' +
    '# 二、总体择校策略（结合分数/专业/地域综合点评，冲稳保配比建议）\n' +
    '# 三、院校逐校详细分析（每校一小节 ##：\n' +
    '   - 学校层次与学科实力\n' +
    '   - 为什么建议冲/稳/保\n' +
    '   - 分数匹配度点评（结合考生分数）\n' +
    '   - 报考热度与录取率解读\n' +
    '   - 备考/报考要点提示\n' +
    '   - 官网链接）\n' +
    '# 四、风险与备选提示\n' +
    '# 五、复习冲刺建议（分科目、分时间）\n' +
    '# 六、免责声明\n\n' +
    '要求：语言专业、客观、有温度；总分>500字以上详尽输出。直接输出 Markdown 正文，不要包裹 ``` 代码块。'
  );
}

exports.main = async (event = {}, context) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { code: -2, message: '服务端未配置 DEEPSEEK_API_KEY', data: null };
  }

  const action = typeof event?.action === 'string' ? event.action : 'chat';

  try {
    let messages = [];
    if (action === 'report') {
      const userData = event?.userData || {};
      const universities = event?.universities || [];
      if (!Array.isArray(universities) || universities.length === 0) {
        return { code: -1, message: '缺少推荐院校数据', data: null };
      }
      messages = [
        { role: 'system', content: '你是严谨、专业的考研择校报告撰写专家，输出 Markdown。' },
        { role: 'user', content: buildReportPrompt(userData, universities) },
      ];
      const result = await callDeepSeek(messages, 8000);
      const text = result?.choices?.[0]?.message?.content || '';
      return {
        code: 0,
        message: 'ok',
        data: { content: text, usage: result?.usage || null },
      };
    } else {
      // 默认 chat：对话式推荐
      const userText =
        (typeof event?.message === 'string' && event.message.trim()) ||
        (typeof event?.content === 'string' && event.content.trim()) ||
        (typeof event === 'string' && event.trim());
      if (!userText) {
        return { code: -1, message: '缺少用户输入', data: null };
      }
      messages = [
        { role: 'system', content: '你是严谨、专业的考研择校助手，只输出要求的 JSON。' },
        { role: 'user', content: buildPrompt(userText.slice(0, 500)) },
      ];
    }

    const result = await callDeepSeek(messages);
    const text = result?.choices?.[0]?.message?.content || '';
    return {
      code: 0,
      message: 'ok',
      data: { content: text, usage: result?.usage || null },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { code: -3, message: msg, data: null };
  }
};
