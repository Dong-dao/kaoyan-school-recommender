import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 关于 */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">考研院校推荐系统</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              基于大数据和AI算法的智能考研院校推荐平台，帮助考生科学选择目标院校。
            </p>
          </div>

          {/* 功能特点 */}
          <div>
            <h4 className="text-white font-semibold mb-4">功能特点</h4>
            <ul className="space-y-2 text-sm">
              <li>✓ 智能冲稳保推荐</li>
              <li>✓ 历年数据分析</li>
              <li>✓ 院校详情展示</li>
              <li>✓ 官网直达链接</li>
            </ul>
          </div>

          {/* 数据来源 */}
          <div>
            <h4 className="text-white font-semibold mb-4">数据来源</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://yz.chsi.com.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">研招网</a></li>
              <li><a href="#" className="hover:text-white transition-colors">各高校研究生院</a></li>
              <li><a href="#" className="hover:text-white transition-colors">教育部官方数据</a></li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h4 className="text-white font-semibold mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 3534885120@qq.com</li>
              <li>📞 19959670112</li>
              <li>🏢 海口市美兰区</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 考研院校推荐系统. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">隐私政策</a>
            <a href="#" className="hover:text-white transition-colors">使用条款</a>
            <a href="#" className="hover:text-white transition-colors">帮助中心</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
