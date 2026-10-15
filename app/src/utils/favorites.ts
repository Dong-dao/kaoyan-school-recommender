import type { University } from '../types';

const FAVORITES_KEY = 'kaoyan_favorites';

// 获取收藏列表
export const getFavorites = (): University[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// 添加收藏
export const addFavorite = (university: University): void => {
  const favorites = getFavorites();
  if (!favorites.find((f) => f.id === university.id)) {
    favorites.push(university);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};

// 取消收藏
export const removeFavorite = (universityId: string): void => {
  const favorites = getFavorites().filter((f) => f.id !== universityId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

// 检查是否已收藏
export const isFavorite = (universityId: string): boolean => {
  return getFavorites().some((f) => f.id === universityId);
};

// 切换收藏状态
export const toggleFavorite = (university: University): boolean => {
  if (isFavorite(university.id)) {
    removeFavorite(university.id);
    return false;
  } else {
    addFavorite(university);
    return true;
  }
};

// 清空收藏
export const clearFavorites = (): void => {
  localStorage.removeItem(FAVORITES_KEY);
};
