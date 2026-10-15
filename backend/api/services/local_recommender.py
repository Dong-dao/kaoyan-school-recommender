"""
本地推荐算法（降级方案）

当 Deepseek API 未配置或调用失败时使用。
基于内置院校数据库，根据用户分数动态筛选冲稳保三档。
"""
import logging

logger = logging.getLogger(__name__)

# 内置院校数据库（分数为参考值）
BUILTIN_UNIVERSITIES = [
    {'name': '清华大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 380, 'avgScore': 405, 'maxScore': 430, 'admissionRate': 5.2, 'location': '北京', 'officialWebsite': 'https://www.tsinghua.edu.cn', 'description': '中国顶尖学府，工科实力全国第一'},
    {'name': '北京大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 375, 'avgScore': 400, 'maxScore': 425, 'admissionRate': 6.8, 'location': '北京', 'officialWebsite': 'https://www.pku.edu.cn', 'description': '综合实力顶尖，文理兼修'},
    {'name': '浙江大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 370, 'avgScore': 395, 'maxScore': 420, 'admissionRate': 8.5, 'location': '杭州', 'officialWebsite': 'https://www.zju.edu.cn', 'description': '综合性大学，创新创业氛围浓厚'},
    {'name': '上海交通大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 365, 'avgScore': 390, 'maxScore': 415, 'admissionRate': 9.2, 'location': '上海', 'officialWebsite': 'https://www.sjtu.edu.cn', 'description': '理工科实力强劲，地处上海就业优势明显'},
    {'name': '复旦大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 360, 'avgScore': 385, 'maxScore': 410, 'admissionRate': 10.5, 'location': '上海', 'officialWebsite': 'https://www.fudan.edu.cn', 'description': '人文社科与医学顶尖'},
    {'name': '南京大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 355, 'avgScore': 378, 'maxScore': 400, 'admissionRate': 12.3, 'location': '南京', 'officialWebsite': 'https://www.nju.edu.cn', 'description': 'C9联盟成员，学术底蕴深厚'},
    {'name': '中国科学技术大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 350, 'avgScore': 372, 'maxScore': 395, 'admissionRate': 13.8, 'location': '合肥', 'officialWebsite': 'https://www.ustc.edu.cn', 'description': '理科全国顶尖，学风严谨'},
    {'name': '哈尔滨工业大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 345, 'avgScore': 368, 'maxScore': 390, 'admissionRate': 15.2, 'location': '哈尔滨', 'officialWebsite': 'https://www.hit.edu.cn', 'description': '工科实力全国顶尖'},
    {'name': '西安交通大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 340, 'avgScore': 362, 'maxScore': 385, 'admissionRate': 16.5, 'location': '西安', 'officialWebsite': 'https://www.xjtu.edu.cn', 'description': '工科传统强校，C9成员'},
    {'name': '武汉大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 335, 'avgScore': 358, 'maxScore': 380, 'admissionRate': 18.2, 'location': '武汉', 'officialWebsite': 'https://www.whu.edu.cn', 'description': '最美校园之一，综合实力强劲'},
    {'name': '华中科技大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 332, 'avgScore': 355, 'maxScore': 378, 'admissionRate': 19.5, 'location': '武汉', 'officialWebsite': 'https://www.hust.edu.cn', 'description': '光电、机械、医学领域领先'},
    {'name': '中山大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 330, 'avgScore': 352, 'maxScore': 375, 'admissionRate': 20.8, 'location': '广州', 'officialWebsite': 'https://www.sysu.edu.cn', 'description': '华南地区最高学府'},
    {'name': '天津大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 328, 'avgScore': 350, 'maxScore': 372, 'admissionRate': 21.5, 'location': '天津', 'officialWebsite': 'https://www.tju.edu.cn', 'description': '工科强校，化工、建筑突出'},
    {'name': '东南大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 325, 'avgScore': 348, 'maxScore': 370, 'admissionRate': 22.3, 'location': '南京', 'officialWebsite': 'https://www.seu.edu.cn', 'description': '建筑老八校，电子信息优势明显'},
    {'name': '北京航空航天大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 330, 'avgScore': 355, 'maxScore': 380, 'admissionRate': 18.8, 'location': '北京', 'officialWebsite': 'https://www.buaa.edu.cn', 'description': '航空航天特色强校'},
    {'name': '电子科技大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 320, 'avgScore': 342, 'maxScore': 365, 'admissionRate': 24.2, 'location': '成都', 'officialWebsite': 'https://www.uestc.edu.cn', 'description': '电子信息领域顶尖'},
    {'name': '北京邮电大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 322, 'avgScore': 345, 'maxScore': 368, 'admissionRate': 23.5, 'location': '北京', 'officialWebsite': 'https://www.bupt.edu.cn', 'description': '通信与计算机领域顶尖211'},
    {'name': '西安电子科技大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 315, 'avgScore': 338, 'maxScore': 360, 'admissionRate': 25.8, 'location': '西安', 'officialWebsite': 'https://www.xidian.edu.cn', 'description': '电子信息类强校'},
    {'name': '四川大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 318, 'avgScore': 340, 'maxScore': 362, 'admissionRate': 25.6, 'location': '成都', 'officialWebsite': 'https://www.scu.edu.cn', 'description': '西南地区综合性大学'},
    {'name': '山东大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 315, 'avgScore': 336, 'maxScore': 358, 'admissionRate': 26.8, 'location': '济南', 'officialWebsite': 'https://www.sdu.edu.cn', 'description': '学科门类齐全，数学、医学实力强'},
    {'name': '吉林大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 310, 'avgScore': 330, 'maxScore': 352, 'admissionRate': 28.5, 'location': '长春', 'officialWebsite': 'https://www.jlu.edu.cn', 'description': '规模庞大的综合性大学'},
    {'name': '中南大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 312, 'avgScore': 332, 'maxScore': 354, 'admissionRate': 27.8, 'location': '长沙', 'officialWebsite': 'https://www.csu.edu.cn', 'description': '冶金、材料、湘雅医学特色鲜明'},
    {'name': '重庆大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 308, 'avgScore': 328, 'maxScore': 348, 'admissionRate': 29.5, 'location': '重庆', 'officialWebsite': 'https://www.cqu.edu.cn', 'description': '建筑、电气、机械工程优势明显'},
    {'name': '大连理工大学', 'level': '985/双一流', 'majorType': '专业组', 'minScore': 305, 'avgScore': 325, 'maxScore': 345, 'admissionRate': 31.5, 'location': '大连', 'officialWebsite': 'https://www.dlut.edu.cn', 'description': '工科实力强，船舶、化工特色鲜明'},
    {'name': '湖南大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 300, 'avgScore': 320, 'maxScore': 340, 'admissionRate': 32.8, 'location': '长沙', 'officialWebsite': 'https://www.hnu.edu.cn', 'description': '千年学府，机械、土木、电气实力强劲'},
    {'name': '厦门大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 302, 'avgScore': 322, 'maxScore': 342, 'admissionRate': 32.0, 'location': '厦门', 'officialWebsite': 'https://www.xmu.edu.cn', 'description': '最美校园，经济、化学突出'},
    {'name': '东北大学', 'level': '985/双一流', 'majorType': '专硕', 'minScore': 295, 'avgScore': 315, 'maxScore': 335, 'admissionRate': 34.5, 'location': '沈阳', 'officialWebsite': 'https://www.neu.edu.cn', 'description': '冶金、材料、自动化老牌强校'},
    {'name': '南京理工大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 298, 'avgScore': 318, 'maxScore': 338, 'admissionRate': 35.2, 'location': '南京', 'officialWebsite': 'https://www.njust.edu.cn', 'description': '兵器、光学、材料特色鲜明'},
    {'name': '武汉理工大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 292, 'avgScore': 312, 'maxScore': 332, 'admissionRate': 36.5, 'location': '武汉', 'officialWebsite': 'https://www.whut.edu.cn', 'description': '材料、交通、汽车特色强校'},
    {'name': '兰州大学', 'level': '985/双一流', 'majorType': '学硕', 'minScore': 285, 'avgScore': 305, 'maxScore': 325, 'admissionRate': 38.5, 'location': '兰州', 'officialWebsite': 'https://www.lzu.edu.cn', 'description': '西北顶尖985，化学、大气科学实力强'},
    {'name': '北京科技大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 288, 'avgScore': 308, 'maxScore': 328, 'admissionRate': 39.5, 'location': '北京', 'officialWebsite': 'https://www.ustb.edu.cn', 'description': '冶金、材料特色鲜明'},
    {'name': '华东理工大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 285, 'avgScore': 305, 'maxScore': 325, 'admissionRate': 40.5, 'location': '上海', 'officialWebsite': 'https://www.ecust.edu.cn', 'description': '化工领域顶尖211'},
    {'name': '郑州大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 275, 'avgScore': 295, 'maxScore': 315, 'admissionRate': 42.5, 'location': '郑州', 'officialWebsite': 'https://www.zzu.edu.cn', 'description': '中部最大综合性大学'},
    {'name': '苏州大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 280, 'avgScore': 300, 'maxScore': 320, 'admissionRate': 41.5, 'location': '苏州', 'officialWebsite': 'https://www.suda.edu.cn', 'description': '江南强校，材料、医学、法学不错'},
    {'name': '福州大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 272, 'avgScore': 292, 'maxScore': 312, 'admissionRate': 43.5, 'location': '福州', 'officialWebsite': 'https://www.fzu.edu.cn', 'description': '东南沿海重点大学'},
    {'name': '南昌大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 268, 'avgScore': 288, 'maxScore': 308, 'admissionRate': 45.5, 'location': '南昌', 'officialWebsite': 'https://www.ncu.edu.cn', 'description': '江西最强综合性大学'},
    {'name': '合肥工业大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 270, 'avgScore': 290, 'maxScore': 310, 'admissionRate': 44.2, 'location': '合肥', 'officialWebsite': 'https://www.hfut.edu.cn', 'description': '工科老牌211，车辆、机械扎实'},
    {'name': '云南大学', 'level': '211/双一流', 'majorType': '学硕', 'minScore': 260, 'avgScore': 280, 'maxScore': 300, 'admissionRate': 48.5, 'location': '昆明', 'officialWebsite': 'https://www.ynu.edu.cn', 'description': '民族学、生态学特色鲜明'},
    {'name': '昆明理工大学', 'level': '省属重点', 'majorType': '专硕', 'minScore': 255, 'avgScore': 275, 'maxScore': 295, 'admissionRate': 50.5, 'location': '昆明', 'officialWebsite': 'https://www.kmust.edu.cn', 'description': '西南工科强校，有色金属领域领先'},
    {'name': '广西大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 262, 'avgScore': 282, 'maxScore': 302, 'admissionRate': 47.5, 'location': '南宁', 'officialWebsite': 'https://www.gxu.edu.cn', 'description': '广西最强综合性大学'},
    {'name': '太原理工大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 250, 'avgScore': 270, 'maxScore': 290, 'admissionRate': 52.5, 'location': '太原', 'officialWebsite': 'https://www.tyut.edu.cn', 'description': '山西最强理工类大学'},
    {'name': '贵州大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 248, 'avgScore': 268, 'maxScore': 288, 'admissionRate': 53.5, 'location': '贵阳', 'officialWebsite': 'https://www.gzu.edu.cn', 'description': '贵州最强综合性大学'},
    {'name': '海南大学', 'level': '211/双一流', 'majorType': '专硕', 'minScore': 245, 'avgScore': 265, 'maxScore': 285, 'admissionRate': 55.0, 'location': '海口', 'officialWebsite': 'https://www.hainanu.edu.cn', 'description': '热带特色211'},
    {'name': '石河子大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 238, 'avgScore': 255, 'maxScore': 275, 'admissionRate': 59.5, 'location': '石河子', 'officialWebsite': 'https://www.shzu.edu.cn', 'description': '新疆211，农学、医学特色鲜明'},
    {'name': '新疆大学', 'level': '211/双一流', 'majorType': '专业组', 'minScore': 235, 'avgScore': 252, 'maxScore': 272, 'admissionRate': 60.0, 'location': '乌鲁木齐', 'officialWebsite': 'https://www.xju.edu.cn', 'description': '新疆顶尖学府'},
]


# 专业分数偏移
MAJOR_OFFSET = {
    '计算机科学与技术': 15, '软件工程': 12, '人工智能': 18,
    '电子信息': 8, '机械工程': 0, '土木工程': -5,
    '金融学': 10, '工商管理': 3, '法学': 5,
    '医学': 12, '教育学': -10, '其他': 0,
}


class LocalRecommender:
    """本地推荐算法"""

    def recommend(self, user_input: dict) -> list:
        score = user_input.get('total_score', 0)
        major = user_input.get('target_major', '')
        offset = MAJOR_OFFSET.get(major, 0)

        # 计算各院校相对用户分数的差距
        scored = []
        for u in BUILTIN_UNIVERSITIES:
            adjusted_avg = u['avgScore'] + offset
            diff = adjusted_avg - score
            scored.append((u, diff))

        # 分档
        chong = [u for u, d in scored if 5 <= d <= 25]
        wen = [u for u, d in scored if -5 <= d <= 5]
        bao = [u for u, d in scored if -30 <= d <= -10]

        # 每个档位取最多4所，按分数相近排序
        chong.sort(key=lambda u: u['avgScore'] + offset)
        wen.sort(key=lambda u: abs((u['avgScore'] + offset) - score))
        bao.sort(key=lambda u: -(u['avgScore'] + offset))

        result = []
        result += [self._to_card(u, '冲', offset) for u in chong[:4]]
        result += [self._to_card(u, '稳', offset) for u in wen[:4]]
        result += [self._to_card(u, '保', offset) for u in bao[:4]]

        # 如果某档为空，从最近区间补充
        if not chong:
            rest = sorted(scored, key=lambda x: x[1])
            for u, _ in rest[:3]:
                if u not in chong:
                    result.append(self._to_card(u, '冲', offset))
        if not wen:
            rest = sorted(scored, key=lambda x: abs(x[1]))
            for u, _ in rest[:3]:
                if not any(c['tier'] == '稳' for c in result):
                    result.append(self._to_card(u, '稳', offset))
        if not bao:
            rest = sorted(scored, key=lambda x: -x[1])
            for u, _ in rest[:3]:
                if u not in bao:
                    result.append(self._to_card(u, '保', offset))

        return result

    @staticmethod
    def _to_card(u: dict, tier: str, offset: int) -> dict:
        return {
            'tier': tier,
            'name': u['name'],
            'level': u['level'],
            'majorType': u['majorType'],
            'minScore': u['minScore'],
            'avgScore': u['avgScore'],
            'maxScore': u['maxScore'],
            'admissionRate': u['admissionRate'],
            'location': u['location'],
            'officialWebsite': u['officialWebsite'],
            'description': u['description'],
        }


local_recommender = LocalRecommender()
