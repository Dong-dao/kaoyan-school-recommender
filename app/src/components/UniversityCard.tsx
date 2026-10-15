import React, { useState, useEffect } from 'react';
import type { University } from '../types';
import { isFavorite, toggleFavorite } from '../utils/favorites';
import { Star, GitCompareArrows } from 'lucide-react';

interface UniversityCardProps {
  university: University;
  userScore: number;
  isCompareMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const UniversityCard: React.FC<UniversityCardProps> = ({
  university,
  userScore,
  isCompareMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // 初始化收藏状态
  useEffect(() => {
    setFavorited(isFavorite(university.id));
  }, [university.id]);

  // 处理收藏切换
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newState = toggleFavorite(university);
    setFavorited(newState);
  };

  const tierColors = {
    '冲': {
      bg: 'from-red-500 to-orange-500',
      badge: 'bg-red-100 text-red-700 border-red-200',
      progress: 'bg-red-500',
    },
    '稳': {
      bg: 'from-yellow-500 to-amber-500',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      progress: 'bg-yellow-500',
    },
    '保': {
      bg: 'from-green-500 to-emerald-500',
      badge: 'bg-green-100 text-green-700 border-green-200',
      progress: 'bg-green-500',
    },
  };

  const colors = tierColors[university.tier];
  
  // 计算分数匹配度
  const scoreMatchRate = Math.min(100, Math.max(0, 
    ((userScore - university.minScore) / (university.maxScore - university.minScore)) * 100
  ));

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border group ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-200'
    }`}>
      {/* 顶部颜色条 */}
      <div className={`h-2 bg-gradient-to-r ${colors.bg}`}></div>
      
      <div className="p-5">
        {/* 标题区域 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${colors.badge} border`}>
                {university.tier}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {university.level}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {university.name}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              📍 {university.location}
            </p>
          </div>
          {/* 收藏和对比按钮组 */}
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-all ${
                favorited
                  ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
              }`}
              title={favorited ? '取消收藏' : '添加收藏'}
            >
              <Star className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
            </button>
            {isCompareMode && onToggleSelect && (
              <button
                onClick={() => onToggleSelect(university.id)}
                className={`p-2 rounded-lg transition-all ${
                  isSelected
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
                }`}
                title={isSelected ? '取消对比' : '加入对比'}
              >
                <GitCompareArrows className={`w-5 h-5 ${isSelected ? '' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* 专业类型标签 */}
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200">
            {university.majorType}
          </span>
        </div>

        {/* 分数信息 */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">录取分数线</span>
            <span className="font-semibold text-gray-900">{university.avgScore}分</span>
          </div>
          
          {/* 分数范围条 */}
          <div className="relative">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>最低 {university.minScore}</span>
              <span>最高 {university.maxScore}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                style={{ width: `${scoreMatchRate}%` }}
              ></div>
            </div>
            <div 
              className="absolute top-4 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"
              style={{ left: `${scoreMatchRate}%` }}
              title={`你的分数：${userScore}`}
            ></div>
          </div>

          {/* 录取率 */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">预计录取率</span>
            <span className={`text-sm font-bold ${
              university.admissionRate >= 30 ? 'text-green-600' : 
              university.admissionRate >= 15 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {university.admissionRate}%
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <a
            href={university.officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            官网
          </a>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showDetails ? '收起' : '详情'}
          </button>
        </div>

        {/* 详细信息（可展开） */}
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3 animate-fadeIn">
            {university.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">院校简介</h4>
                <p className="text-sm text-gray-600">{university.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">院校层次：</span>
                <span className="font-medium text-gray-900">{university.level}</span>
              </div>
              <div>
                <span className="text-gray-500">学位类型：</span>
                <span className="font-medium text-gray-900">{university.majorType}</span>
              </div>
              <div>
                <span className="text-gray-500">最低录取：</span>
                <span className="font-medium text-gray-900">{university.minScore}分</span>
              </div>
              <div>
                <span className="text-gray-500">平均录取：</span>
                <span className="font-medium text-gray-900">{university.avgScore}分</span>
              </div>
              <div>
                <span className="text-gray-500">最高录取：</span>
                <span className="font-medium text-gray-900">{university.maxScore}分</span>
              </div>
              <div>
                <span className="text-gray-500">复录比：</span>
                <span className="font-medium text-gray-900">约{Math.round(100/university.admissionRate)}:1</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <a
                href={university.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                访问 {university.name} 研究生招生网 →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityCard;
