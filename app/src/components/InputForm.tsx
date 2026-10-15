import React, { useState } from 'react';
import type { UserData } from '../types';

interface InputFormProps {
  onSubmit: (data: UserData) => void;
  loading?: boolean;
  error?: string;
}

const MAJORS = [
  '计算机科学与技术',
  '软件工程',
  '人工智能',
  '电子信息',
  '机械工程',
  '土木工程',
  '金融学',
  '工商管理',
  '法学',
  '医学',
  '教育学',
  '其他',
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, loading = false, error = '' }) => {
  const [formData, setFormData] = useState({
    undergraduateSchool: '',
    targetMajor: '',
    englishScore: '',
    mathScore: '',
    totalScore: '',
    cet4Score: '',
    cet6Score: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.undergraduateSchool.trim()) {
      newErrors.undergraduateSchool = '请输入本科院校名称';
    }
    
    if (!formData.targetMajor) {
      newErrors.targetMajor = '请选择目标专业';
    }
    
    if (!formData.totalScore || isNaN(Number(formData.totalScore)) || Number(formData.totalScore) < 0 || Number(formData.totalScore) > 800) {
      newErrors.totalScore = '请输入有效的模拟总分（0-800）';
    }
    
    if (!formData.englishScore || isNaN(Number(formData.englishScore)) || Number(formData.englishScore) < 0 || Number(formData.englishScore) > 100) {
      newErrors.englishScore = '请输入有效的英语分数（0-100）';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        undergraduateSchool: formData.undergraduateSchool,
        targetMajor: formData.targetMajor,
        englishScore: Number(formData.englishScore),
        mathScore: formData.mathScore ? Number(formData.mathScore) : 0,
        totalScore: Number(formData.totalScore),
        cet4Score: formData.cet4Score ? Number(formData.cet4Score) : undefined,
        cet6Score: formData.cet6Score ? Number(formData.cet6Score) : undefined,
      });
    }
  };

  return (
    <section id="input-form" className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">填写你的信息</h2>
          <p className="text-gray-600">我们将根据你的情况为你推荐最适合的院校</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="grid gap-6">
            {/* 本科院校 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                本科院校 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.undergraduateSchool}
                onChange={(e) => setFormData({ ...formData, undergraduateSchool: e.target.value })}
                placeholder="例如：XX大学"
                className={`w-full px-4 py-3 rounded-lg border ${errors.undergraduateSchool ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none`}
              />
              {errors.undergraduateSchool && (
                <p className="mt-1 text-sm text-red-500">{errors.undergraduateSchool}</p>
              )}
            </div>

            {/* 目标专业 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                目标专业 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.targetMajor}
                onChange={(e) => setFormData({ ...formData, targetMajor: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${errors.targetMajor ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white`}
              >
                <option value="">请选择目标专业</option>
                {MAJORS.map((major) => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
              {errors.targetMajor && (
                <p className="mt-1 text-sm text-red-500">{errors.targetMajor}</p>
              )}
            </div>

            {/* 分数区域 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 模拟总分 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  模拟总分 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalScore}
                  onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
                  placeholder="例如：380"
                  min="0"
                  max="800"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.totalScore ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none`}
                />
                {errors.totalScore && (
                  <p className="mt-1 text-sm text-red-500">{errors.totalScore}</p>
                )}
              </div>

              {/* 英语分数 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  英语分数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.englishScore}
                  onChange={(e) => setFormData({ ...formData, englishScore: e.target.value })}
                  placeholder="例如：75"
                  min="0"
                  max="100"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.englishScore ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none`}
                />
                {errors.englishScore && (
                  <p className="mt-1 text-sm text-red-500">{errors.englishScore}</p>
                )}
              </div>

              {/* 数学分数 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  数学分数（选填）
                </label>
                <input
                  type="number"
                  value={formData.mathScore}
                  onChange={(e) => setFormData({ ...formData, mathScore: e.target.value })}
                  placeholder="例如：120"
                  min="0"
                  max="150"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>
            </div>

            {/* 四六级成绩 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CET-4 成绩（选填）
                </label>
                <input
                  type="number"
                  value={formData.cet4Score}
                  onChange={(e) => setFormData({ ...formData, cet4Score: e.target.value })}
                  placeholder="例如：520"
                  min="0"
                  max="710"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CET-6 成绩（选填）
                </label>
                <input
                  type="number"
                  value={formData.cet6Score}
                  onChange={(e) => setFormData({ ...formData, cet6Score: e.target.value })}
                  placeholder="例如：480"
                  min="0"
                  max="710"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 智能推荐中，请稍候...
                </>
              ) : (
                <>🎯 开始智能推荐</>
              )}
            </button>
          </div>
        </form>
        
        {/* 提示信息 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>提示：</strong>系统将基于你的模拟分数，结合历年录取数据，为你推荐"冲一冲"、"稳一稳"、"保一保"三个档位的院校。建议根据自身情况合理选择目标院校。
          </p>
        </div>
      </div>
    </section>
  );
};

export default InputForm;
