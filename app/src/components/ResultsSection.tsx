import React, { useState } from 'react';
import type { UserData, University } from '../types';
import UniversityCard from './UniversityCard';
import ReportDialog from './ReportDialog';
import CompareDialog from './CompareDialog';
import ScoreTrendChart from './ScoreTrendChart';
import FavoritesPanel from './FavoritesPanel';
import { GitCompareArrows, Star, TrendingUp } from 'lucide-react';

interface ResultsSectionProps {
  userData: UserData;
  universities: University[];
  onReset: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ userData, universities, onReset }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState<string[]>([]);
  
  const chongUniversities = universities.filter(u => u.tier === '冲');
  const wenUniversities = universities.filter(u => u.tier === '稳');
  const baoUniversities = universities.filter(u => u.tier === '保');

  // 切换对比选择
  const handleToggleCompareSelect = (id: string) => {
    setCompareSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <section id="results" className="py-12 px-4 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 完整报告入口 */}
        {universities.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  📄 完整院校分析报告
                </h3>
                <p className="text-blue-100 text-sm">
                  DeepSeek AI 基于你的成绩逐校深度分析，生成可下载的 Word / PDF 报告（含复习规划与报考策略）。
                </p>
              </div>
              <button
                onClick={() => setReportOpen(true)}
                className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
              >
                查看完整报告 ¥2
              </button>
            </div>
          </div>
        )}
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          userData={userData}
          universities={universities}
        />
        {/* 用户信息摘要 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 推荐结果</h2>
              <p className="text-gray-600">
                本科院校：<strong>{userData.undergraduateSchool}</strong> | 
                目标专业：<strong>{userData.targetMajor}</strong> | 
                模拟总分：<strong className="text-blue-600">{userData.totalScore}分</strong>
              </p>
            </div>
            <button
              onClick={onReset}
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
            >
              ← 重新填写
            </button>
          </div>
        </div>

        {/* 功能按钮栏 */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setCompareOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-medium shadow-sm"
          >
            <GitCompareArrows className="w-5 h-5" />
            院校对比
            {compareSelectedIds.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                {compareSelectedIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFavoritesOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-yellow-200 text-yellow-700 rounded-xl hover:bg-yellow-50 transition-all font-medium shadow-sm"
          >
            <Star className="w-5 h-5" />
            我的收藏
          </button>
        </div>

        {/* 图例说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">冲</span>
              <div>
                <h3 className="font-bold text-red-700">冲一冲</h3>
                <p className="text-sm text-red-600">录取分数略高于你的模拟分，需要努力冲刺</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">稳</span>
              <div>
                <h3 className="font-bold text-yellow-700">稳一稳</h3>
                <p className="text-sm text-yellow-600">录取分数与你的模拟分相当，把握较大</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">保</span>
              <div>
                <h3 className="font-bold text-green-700">保一保</h3>
                <p className="text-sm text-green-600">录取分数低于你的模拟分，作为保底选择</p>
              </div>
            </div>
          </div>
        </div>

        {/* 冲一冲 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-red-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">🚀 冲一冲 ({chongUniversities.length}所)</h3>
            <span className="text-sm text-gray-500">分数要求较高，适合冲刺</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chongUniversities.map((uni) => (
              <UniversityCard 
                key={uni.id} 
                university={uni} 
                userScore={userData.totalScore}
                isCompareMode={compareOpen}
                isSelected={compareSelectedIds.includes(uni.id)}
                onToggleSelect={handleToggleCompareSelect}
              />
            ))}
          </div>
        </div>

        {/* 稳一稳 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">⭐ 稳一稳 ({wenUniversities.length}所)</h3>
            <span className="text-sm text-gray-500">分数匹配度最高，推荐重点考虑</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wenUniversities.map((uni) => (
              <UniversityCard 
                key={uni.id} 
                university={uni} 
                userScore={userData.totalScore}
                isCompareMode={compareOpen}
                isSelected={compareSelectedIds.includes(uni.id)}
                onToggleSelect={handleToggleCompareSelect}
              />
            ))}
          </div>
        </div>

        {/* 保一保 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-green-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">🛡️ 保一保 ({baoUniversities.length}所)</h3>
            <span className="text-sm text-gray-500">录取概率高，作为备选方案</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baoUniversities.map((uni) => (
              <UniversityCard 
                key={uni.id} 
                university={uni} 
                userScore={userData.totalScore}
                isCompareMode={compareOpen}
                isSelected={compareSelectedIds.includes(uni.id)}
                onToggleSelect={handleToggleCompareSelect}
              />
            ))}
          </div>
        </div>

        {/* 分数线趋势图 */}
        {universities.length > 0 && (
          <div className="mb-10">
            <ScoreTrendChart universities={universities} />
          </div>
        )}

        {/* 免责声明 */}
        <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-700 mb-2">⚠️ 免责声明</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>本系统推荐结果仅供参考，实际录取情况请以各高校官方公布为准</li>
            <li>录取分数线会因年份、专业、报考人数等因素波动</li>
            <li>建议结合自身实际情况，合理填报志愿</li>
            <li>数据来源：研招网、各高校研究生院官网</li>
          </ul>
        </div>

        {/* 对话框组件 */}
        <CompareDialog
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          universities={universities}
          selectedIds={compareSelectedIds}
          onToggleSelect={handleToggleCompareSelect}
        />
        <FavoritesPanel
          open={favoritesOpen}
          onClose={() => setFavoritesOpen(false)}
        />
      </div>
    </section>
  );
};

export default ResultsSection;
