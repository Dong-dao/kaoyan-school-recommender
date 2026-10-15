import React, { useState } from 'react';
import type { University } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreTrendChartProps {
  universities: University[];
}

// 生成模拟历史数据
const generateTrendData = (university: University) => {
  const baseAvg = university.avgScore;
  const baseMin = university.minScore;
  const baseMax = university.maxScore;

  return [
    { year: '2020', min: baseMin - 18, avg: baseAvg - 12, max: baseMax - 8 },
    { year: '2021', min: baseMin - 15, avg: baseAvg - 8, max: baseMax - 5 },
    { year: '2022', min: baseMin - 10, avg: baseAvg - 4, max: baseMax - 2 },
    { year: '2023', min: baseMin - 5, avg: baseAvg - 2, max: baseMax },
    { year: '2024', min: baseMin, avg: baseAvg, max: baseMax + 3 },
  ];
};

// 颜色配置
const tierColors: Record<string, { line: string; area: string; bg: string }> = {
  冲: {
    line: '#ef4444',
    area: 'rgba(239, 68, 68, 0.1)',
    bg: 'bg-red-50',
  },
  稳: {
    line: '#eab308',
    area: 'rgba(234, 179, 8, 0.1)',
    bg: 'bg-yellow-50',
  },
  保: {
    line: '#22c55e',
    area: 'rgba(34, 197, 94, 0.1)',
    bg: 'bg-green-50',
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800 mb-2">{label}年</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}分</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ universities }) => {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(
    universities[0] || null
  );
  const [showAll, setShowAll] = useState(false);

  // 合并所有院校数据用于对比视图
  const allData = showAll
    ? [
        '2020',
        '2021',
        '2022',
        '2023',
        '2024',
      ].map((year) => {
        const point: any = { year };
        universities.forEach((uni) => {
          const data = generateTrendData(uni);
          const yearData = data.find((d) => d.year === year);
          if (yearData) {
            point[`${uni.name}_avg`] = yearData.avg;
          }
        });
        return point;
      })
    : selectedUniversity
    ? generateTrendData(selectedUniversity)
    : [];

  // 计算趋势
  const getTrend = (uni: University) => {
    const data = generateTrendData(uni);
    if (data.length < 2) return { value: 0, label: '持平' };
    const trend = data[data.length - 1].avg - data[0].avg;
    if (Math.abs(trend) <= 2) return { value: 0, label: '持平' };
    if (trend > 0)
      return { value: trend, label: `上升 ${trend}分`, direction: 'up' as const };
    return { value: Math.abs(trend), label: `下降 ${Math.abs(trend)}分`, direction: 'down' as const };
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              分数线趋势分析
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              近5年录取分数线变化趋势（模拟数据）
            </p>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showAll
                ? 'bg-white text-indigo-700'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {showAll ? '单校查看' : '全部对比'}
          </button>
        </div>
      </div>

      {/* 院校选择器（单校模式） */}
      {!showAll && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => setSelectedUniversity(uni)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedUniversity?.id === uni.id
                    ? `${tierColors[uni.tier].bg} ${
                        uni.tier === '冲'
                          ? 'text-red-700 border-red-300'
                          : uni.tier === '稳'
                          ? 'text-yellow-700 border-yellow-300'
                          : 'text-green-700 border-green-300'
                      } border shadow-sm`
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {uni.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={allData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {!showAll && selectedUniversity && (
                <linearGradient
                  id={`gradient_${selectedUniversity.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={tierColors[selectedUniversity.tier].line}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={tierColors[selectedUniversity.tier].line}
                    stopOpacity={0}
                  />
                </linearGradient>
              )}
              {showAll &&
                universities.map((uni) => (
                  <linearGradient
                    key={uni.id}
                    id={`gradient_all_${uni.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={tierColors[uni.tier].line}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={tierColors[uni.tier].line}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 13 }} stroke="#9ca3af" />
            <YAxis
              domain={['dataMin - 10', 'dataMax + 10']}
              tick={{ fontSize: 13 }}
              stroke="#9ca3af"
              unit="分"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {!showAll && selectedUniversity ? (
              <>
                <Area
                  type="monotone"
                  dataKey="max"
                  name="最高分"
                  stroke="#94a3b8"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="avg"
                  name="平均分"
                  stroke={tierColors[selectedUniversity.tier].line}
                  strokeWidth={3}
                  fill={`url(#gradient_${selectedUniversity.id})`}
                />
                <Area
                  type="monotone"
                  dataKey="min"
                  name="最低分"
                  stroke="#6b7280"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </>
            ) : (
              showAll &&
              universities.map((uni) => (
                <Line
                  key={uni.id}
                  type="monotone"
                  dataKey={`${uni.name}_avg`}
                  name={`${uni.name}(均分)`}
                  stroke={tierColors[uni.tier].line}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* 趋势统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
          {(showAll ? universities : selectedUniversity ? [selectedUniversity] : []).map(
            (uni) => {
              const trend = getTrend(uni);
              return (
                <div
                  key={uni.id}
                  className={`p-3 rounded-xl ${tierColors[uni.tier].bg} border ${
                    uni.tier === '冲'
                      ? 'border-red-200'
                      : uni.tier === '稳'
                      ? 'border-yellow-200'
                      : 'border-green-200'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-600 truncate">{uni.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {trend.direction === 'up' ? (
                      <ChevronUp className="w-4 h-4 text-red-500" />
                    ) : trend.direction === 'down' ? (
                      <ChevronDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        trend.direction === 'up'
                          ? 'text-red-600'
                          : trend.direction === 'down'
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {trend.label}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* 说明文字 */}
      <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>
            <strong>数据说明：</strong>以上趋势数据为基于当前录取分数的模拟推算，仅供参考。
            实际分数线请以各高校研究生院官方公布为准。建议关注目标院校官网的历年复试线公告。
          </span>
        </p>
      </div>
    </div>
  );
};

export default ScoreTrendChart;
