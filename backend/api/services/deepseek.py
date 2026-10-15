"""
Deepseek API 调用服务

通过 Deepseek 大模型生成考研院校推荐结果。
前端提交用户分数等条件 -> 本服务调用 Deepseek -> 返回冲稳保三段推荐。
"""
import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class DeepseekService:
    """Deepseek 大模型服务封装"""

    @staticmethod
    def _get_headers() -> dict:
        return {
            'Authorization': f'Bearer {settings.DEEPSEEK_API_KEY}',
            'Content-Type': 'application/json',
        }

    @staticmethod
    def generate_recommendation(user_input: dict) -> dict:
        """
        根据用户输入调用 Deepseek 生成推荐结果

        Args:
            user_input: 包含 undergraduate_school, target_major, total_score,
                       english_score, math_score, cet4_score, cet6_score

        Returns:
            dict: 包含 'universities' 列表，每项有冲稳保档位、院校信息
        """
        if not settings.DEEPSEEK_API_KEY:
            raise ValueError('尚未配置 DEEPSEEK_API_KEY，请在 backend/settings.py 中配置')

        # 构建提示词
        prompt = DeepseekService._build_prompt(user_input)

        payload = {
            'model': settings.DEEPSEEK_MODEL,
            'messages': [
                {
                    'role': 'system',
                    'content': (
                        '你是一名资深的考研择校顾问，精通中国各高校研究生招生录取数据。'
                        '请根据考生的模拟分数等条件，为其推荐"冲、稳、保"三个档位的考研院校。'
                        '你必须严格按照 JSON 格式输出，不要输出任何多余文字。'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ],
            'temperature': 0.6,
            'max_tokens': 2000,
            'response_format': {'type': 'json_object'},
        }

        try:
            resp = requests.post(
                settings.DEEPSEEK_API_URL,
                headers=DeepseekService._get_headers(),
                json=payload,
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()

            content = data['choices'][0]['message']['content']
            logger.info('Deepseek 返回结果: %s', content[:200])

            # 解析返回的 JSON
            result = DeepseekService._parse_response(content)
            return result

        except requests.exceptions.RequestException as e:
            logger.error('Deepseek API 请求失败: %s', e)
            raise RuntimeError(f'Deepseek API 请求失败: {e}') from e
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            logger.error('Deepseek 响应解析失败: %s', e)
            raise RuntimeError(f'Deepseek 响应解析失败: {e}') from e

    @staticmethod
    def _build_prompt(user_input: dict) -> str:
        """构建发送给 Deepseek 的提示词"""
        return (
            f'请根据以下考生信息推荐考研院校：\n'
            f'- 本科院校：{user_input.get("undergraduate_school", "未填写")}\n'
            f'- 目标专业：{user_input.get("target_major", "未指定")}\n'
            f'- 模拟总分：{user_input.get("total_score", 0)}分\n'
            f'- 英语成绩：{user_input.get("english_score", 0)}分\n'
            f'- 数学成绩：{user_input.get("math_score", 0) or "未填"}分\n'
            f'- CET-4：{user_input.get("cet4_score", "未填")}\n'
            f'- CET-6：{user_input.get("cet6_score", "未填")}\n\n'
            f'请分别推荐5所"冲"档院校、5所"稳"档院校、5所"保"档院校。\n'
            f'每所院校必须包含以下字段：\n'
            f'  name（院校名称）、level（院校档次如985/211/双一流）、'
            f'majorType（学位类型：学硕/专硕/专业组）、'
            f'minScore（最低录取分）、avgScore（平均录取分）、'
            f'maxScore（最高录取分）、admissionRate（录取率百分比）、'
            f'location（所在城市）、officialWebsite（研究生院官网链接）、'
            f'description（一句话院校简介）\n'
            f'请以 JSON 格式返回，结构为：'
            f'{{"universities": [{{"tier": "冲|稳|保", "name": "...", ...}}]}}'
        )

    @staticmethod
    def _parse_response(content: str) -> dict:
        """从 Deepseek 返回内容中提取 JSON"""
        # 尝试直接解析
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # 尝试提取 JSON 代码块
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))

        # 尝试提取花括号包裹的最外层 JSON
        start = content.find('{')
        end = content.rfind('}')
        if start != -1 and end != -1 and end > start:
            return json.loads(content[start:end + 1])

        raise ValueError('无法从 Deepseek 响应中解析出有效的 JSON 数据')


# 单例导出
deepseek_service = DeepseekService()
