import React from 'react';
import type { University } from '../types';
import { getFavorites, removeFavorite, clearFavorites } from '../utils/favorites';
import { X, Star, Trash2, ExternalLink, MapPin, TrendingUp } from 'lucide-react';

interface FavoritesPanelProps {
  open: boolean;
  onClose: () => void;
  onViewDetail?: (university: University) => void;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ open, onClose, onViewDetail }) => {
  const favorites = getFavorites();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 fill-current" />
            <h2 className="text-xl font-bold">我的收藏</h2>
            <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
              {favorites.length} 所院校
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-500">还没有收藏任何院校</p>
              <p className="text-sm text-gray-400 mt-1">
                在推荐结果中点击星标图标即可收藏
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 收藏列表 */}
              {favorites.map((uni) => (
                <div
                  key={uni.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            uni.tier === '冲'
                              ? 'bg-red-100 text-red-700'
                              : uni.tier === '稳'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {uni.tier}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {uni.level}
                        </span>
                        <h3 className="font-bold text-gray-900">{uni.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {uni.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" /> 均分 {uni.avgScore}
                        </span>
                        <span>录取率 {uni.admissionRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={uni.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="访问官网"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => removeFavorite(uni.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="取消收藏"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {favorites.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <button
              onClick={() => {
                if (confirm('确定要清空所有收藏吗？')) {
                  clearFavorites();
                }
              }}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> 清空全部
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPanel;
