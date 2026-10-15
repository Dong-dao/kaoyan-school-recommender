import React, { useState } from 'react';
import type { University } from '../types';
import {
  X,
  GitCompareArrows,
  MapPin,
  Award,
  TrendingUp,
  BarChart3,
  GraduationCap,
  Star,
} from 'lucide-react';

interface CompareDialogProps {
  open: boolean;
  onClose: () => void;
  universities: University[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

// 模拟历年分数线数据（实际项目中应从API获取）
const generateHistoricalScores = (university: University) => {
  const baseScore = university.avgScore;
  return [
    { year: '2021', min: baseScore - 15, avg: baseScore - 8, max: baseScore + 5 },
    { year: '2022', min: baseScore - 12, avg: baseScore - 5, max: baseScore + 8 },
    { year: '2023', min: baseScore - 10, avg: baseScore - 3, max: baseScore + 10 },
    { year: '2024', min: university.minScore, avg: university.avgScore, max: university.maxScore },
    { year: '2025(预估)', min: baseScore - 8, avg: baseScore, max: baseScore + 12 },
  ];
};

const CompareDialog: React.FC<CompareDialogProps> = ({
  open,
  onClose,
  universities,
  selectedIds,
  onToggleSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'trend'>('overview');

  if (!open) return null;

  const selectedUniversities = universities.filter((u) => selectedIds.includes(u.id));

  // 计算综合评分（用于排名）
  const calculateOverallScore = (uni: University) => {
    const scoreLevel = (400 - uni.minScore) / 200 * 40; // 分数优势
    const rateLevel = uni.admissionRate; // 录取率
    const levelBonus = uni.level === '985' ? 20 : uni.level === '211' ? 15 : 10; // 层级加分
    return Math.round(scoreLevel + rateLevel * 0.3 + levelBonus);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="w-6 h-6" />
            <h2 className="text-xl font-bold">院校对比分析</h2>
            <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
              已选 {selectedUniversities.length}/3 所
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 选择院校区域 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-3">选择要对比的院校（最多3所）：</p>
          <div className="flex flex-wrap gap-2">
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => onToggleSelect(uni.id)}
                disabled={!selectedIds.includes(uni.id) && selectedUniversities.length >= 3}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedIds.includes(uni.id)
                    ? 'bg-blue-600 text-white shadow-md'
                    : selectedUniversities.length >= 3
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {uni.name}
                {selectedIds.includes(uni.id) && <Star className="w-3 h-3 inline ml-1 fill-current" />}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        {selectedUniversities.length > 0 ? (
          <>
            {/* 标签页切换 */}
            <div className="flex gap-1 px-6 pt-4 bg-white">
              {[
                { id: 'overview' as const, label: '综合对比', icon: BarChart3 },
                { id: 'scores' as const, label: '分数详情', icon: Award },
                { id: 'trend' as const, label: '趋势分析', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 对比内容 */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 综合评分雷达图式表格 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedUniversities.map((uni) => (
                      <div
                        key={uni.id}
                        className={`rounded-xl p-5 border-2 ${
                          uni.tier === '冲'
                            ? 'border-red-200 bg-red-50/50'
                            : uni.tier === '稳'
                            ? 'border-yellow-200 bg-yellow-50/50'
                            : 'border-green-200 bg-green-50/50'
                        }`}
                      >
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg text-gray-900">{uni.name}</h3>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded ${
                              uni.tier === '冲'
                                ? 'bg-red-500 text-white'
                                : uni.tier === '稳'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            {uni.tier}
                          </span>
                        </div>

                        {/* 综合评分 */}
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculateOverallScore(uni)}
                          </div>
                          <p className="text-xs text-gray-500">综合推荐指数</p>
                        </div>

                        {/* 关键指标 */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" /> 层次
                            </span>
                            <span className="font-semibold">{uni.level}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> 地区
                            </span>
                            <span className="font-semibold">{uni.location}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Award className="w-4 h-4" /> 均分
                            </span>
                            <span className="font-semibold">{uni.avgScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" /> 录取率
                            </span>
                            <span
                              className={`font-bold ${
                                uni.admissionRate >= 30
                                  ? 'text-green-600'
                                  : uni.admissionRate >= 15
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {uni.admissionRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 对比总结 */}
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      对比分析结论
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-900">
                      {selectedUniversities.length >= 2 && (
                        <>
                          <li>
                            •{' '}
                            <strong>分数门槛最低</strong>：
                            {selectedUniversities.reduce((min, u) =>
                              u.minScore < min.minScore ? u : min
                            ).name}{' '}
                            ({Math.min(...selectedUniversities.map((u) => u.minScore))}分)
                          </li>
                          <li>
                            •{' '}
                            <strong>录取率最高</strong>：
                            {selectedUniversities.reduce((max, u) =>
                              u.admissionRate > max.admissionRate ? u : max
                            ).name}{' '}
                            ({Math.max(...selectedUniversities.map((u) => u.admissionRate))}%)
                          </li>
                          <li>
                            •{' '}
                            <strong>层次最优</strong>：
                            {selectedUniversities.find(
                              (u) => u.level === '985'
                            )?.name ||
                              selectedUniversities.find(
                                (u) => u.level === '211'
                              )?.name ||
                              selectedUniversities[0]?.name}
                          </li>
                        </>
                      )}
                      <li>
                        • 建议：根据自身风险承受能力，可考虑{' '}
                        <strong>
                          {selectedUniversities.find((u) => u.tier === '保')?.name || '保底院校'}
                        </strong>{' '}
                        作为稳妥选择
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'scores' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <th className="px-4 py-3 text-left rounded-tl-lg">对比维度</th>
                        {selectedUniversities.map((uni) => (
                          <th key={uni.id} className="px-4 py-3 text-center">
                            {uni.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '院校层次', key: 'level', highlight: true },
                        { label: '所在地区', key: 'location' },
                        { label: '学位类型', key: 'majorType' },
                        { label: '最低录取分', key: 'minScore', isScore: true },
                        { label: '平均录取分', key: 'avgScore', isScore: true },
                        { label: '最高录取分', key: 'maxScore', isScore: true },
                        { label: '预计录取率', key: 'admissionRate', isPercent: true },
                        { label: '复录比', key: 'admissionRate', isRatio: true },
                      ].map((row, idx) => (
                        <tr
                          key={row.key}
                          className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                        >
                          <td className="px-4 py-3 font-medium text-gray-700 border-b">
                            {row.label}
                          </td>
                          {selectedUniversities.map((uni) => {
                            const value = uni[row.key as keyof University];
                            let displayValue: string | number = String(value);
                            let cellClass = 'text-center border-b';

                            if (row.isScore) {
                              displayValue = Number(value);
                              const numVal = Number(value);
                              // 高亮最优值
                              const values = selectedUniversities.map(
                                (u) => Number(u[row.key as keyof University])
                              );
                              if (row.key === 'minScore' || row.key === 'avgScore') {
                                if (numVal === Math.min(...values)) {
                                  cellClass += ' text-green-600 font-bold';
                                } else if (numVal === Math.max(...values)) {
                                  cellClass += ' text-red-600 font-bold';
                                }
                              }
                            }

                            if (row.isPercent) {
                              displayValue = `${value}%`;
                              const numVal = Number(value);
                              const values = selectedUniversities.map(
                                (u) => Number(u.admissionRate)
                              );
                              if (numVal === Math.max(...values)) {
                                cellClass += ' text-green-600 font-bold';
                              }
                            }

                            if (row.isRatio) {
                              displayValue = `约${Math.round(100 / Number(value))}:1`;
                            }

                            if (row.highlight) {
                              cellClass +=
                                uni.level === '985'
                                  ? ' text-purple-700 font-bold'
                                  : uni.level === '211'
                                  ? ' text-blue-700 font-bold'
                                  : '';
                            }

                            return (
                              <td key={uni.id} className={cellClass}>
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'trend' && (
                <div className="space-y-6">
                  {/* 趋势说明 */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>提示：</strong>以下趋势数据基于模拟数据生成，实际分数线请以各高校官方公布为准。
                      绿色表示平均录取线变化趋势。
                    </p>
                  </div>

                  {/* 各校趋势卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedUniversities.map((uni) => {
                      const history = generateHistoricalScores(uni);
                      const trend =
                        history[history.length - 2].avg - history[0].avg;
                      return (
                        <div
                          key={uni.id}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <div
                            className={`px-4 py-3 ${
                              uni.tier === '冲'
                                ? 'bg-red-500'
                                : uni.tier === '稳'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            } text-white`}
                          >
                            <h4 className="font-bold">{uni.name}</h4>
                            <p className="text-sm opacity-90">
                              近年分数线走势
                            </p>
                          </div>
                          <div className="p-4">
                            {/* 简单柱状图可视化 */}
                            <div className="space-y-2">
                              {history.map((item) => (
                                <div
                                  key={item.year}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-xs text-gray-500 w-16">
                                    {item.year}
                                  </span>
                                  <div className="flex-1 flex items-center gap-1">
                                    <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden">
                                      <div
                                        className={`absolute left-0 top-0 h-full rounded ${
                                          item.year.includes('预估')
                                            ? 'bg-blue-300'
                                            : 'bg-blue-500'
                                        }`}
                                        style={{
                                          width: `${(item.avg / 450) * 100}%`,
                                        }}
                                      ></div>
                                      <span className="absolute right-1 top-0 text-xs font-medium leading-5">
                                        {item.avg}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 趋势指示器 */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                              <span className="text-gray-500">整体趋势</span>
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'
                                }`}
                              >
                                {trend > 0 ? (
                                  <>
                                    <TrendingUp className="w-4 h-4" /> 上升 {Math.abs(trend)}分
                                  </>
                                ) : trend < 0 ? (
                                  <>
                                    <TrendingUp className="w-4 h-4 rotate-180" /> 下降 {Math.abs(trend)}分
                                  </>
                                ) : (
                                  '持平'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <GitCompareArrows className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">请选择至少一所院校进行对比</p>
              <p className="text-sm mt-1">点击上方院校名称添加到对比列表</p>
            </div>
          </div>
        )}

        {/* 底部操作栏 */}
        {selectedUniversities.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              正在对比 <strong>{selectedUniversities.length}</strong> 所院校
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => selectedIds.forEach((id) => onToggleSelect(id))}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                清空选择
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                完成对比
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareDialog;
