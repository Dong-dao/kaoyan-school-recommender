import React from 'react';
import SearchIcon from '../icons/SearchIcon';

const HeroSection: React.FC = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center text-white">
        <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
          <SearchIcon size={16} color="white" />
          <span className="ml-2 text-sm">智能推荐 · 数据驱动 · 精准匹配</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          考研院校
          <span className="block text-yellow-300">智能推荐系统</span>
        </h1>
        
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          基于复录比算法，输入你的本科背景和模拟分数，
          <br className="hidden md:block" />
          为你精准推荐"冲、稳、保"三档目标院校
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a 
            href="#input-form"
            className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            立即开始推荐 →
          </a>
          <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
            了解更多 ↓
          </button>
        </div>
        
        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold">800+</div>
            <div className="text-sm text-blue-200 mt-1">覆盖院校</div>
          </div>
          <div>
            <div className="text-3xl font-bold">95%</div>
            <div className="text-sm text-blue-200 mt-1">推荐准确率</div>
          </div>
          <div>
            <div className="text-3xl font-bold">50万+</div>
            <div className="text-sm text-blue-200 mt-1">服务考生</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
