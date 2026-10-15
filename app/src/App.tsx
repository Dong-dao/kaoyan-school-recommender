import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import InputForm from './components/InputForm';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';
import type { UserData, University } from './types';
import { generateRecommendations } from './utils/recommendation';
import { checkCloudBaseConnection, saveRecommendationRecord } from './utils/cloudbase';
import type { CloudSyncState } from './utils/cloudbase';
import AiChatWidget from './components/AiChatWidget';

const App: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [userData, setUserData] = useState<UserData>({
    undergraduateSchool: '',
    targetMajor: '',
    englishScore: 0,
    mathScore: 0,
    totalScore: 0,
    cet4Score: undefined,
    cet6Score: undefined,
  });
  const [recommendedUniversities, setRecommendedUniversities] = useState<University[]>([]);
  const [cloudState, setCloudState] = useState<CloudSyncState>('unknown');

  // 初始化时检测 CloudBase 连接状态
  useEffect(() => {
    let mounted = true;
    checkCloudBaseConnection().then((res) => {
      if (!mounted) return;
      setCloudState(res.connected ? 'online' : 'offline');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleFormSubmit = async (data: UserData) => {
    setLoading(true);
    setError('');
    try {
      // 本地推荐算法生成冲稳保院校（云端 AI 推荐需配置 Token Credits 资源包后启用）
      const universities = generateRecommendations(data);
      setUserData(data);
      setRecommendedUniversities(universities);
      setShowResults(true);

      // 将查询记录保存到 CloudBase（失败不影响推荐结果展示）
      if (cloudState !== 'offline') {
        void saveRecommendationRecord({
          undergraduateSchool: data.undergraduateSchool,
          targetMajor: data.targetMajor,
          totalScore: data.totalScore,
          englishScore: data.englishScore,
          mathScore: data.mathScore,
          cet4Score: data.cet4Score,
          cet6Score: data.cet6Score,
          universities,
        });
      }

      // 滚动到结果区域
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('推荐失败:', err);
      setError(err instanceof Error ? err.message : '推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setError('');
    setUserData({
      undergraduateSchool: '',
      targetMajor: '',
      englishScore: 0,
      mathScore: 0,
      totalScore: 0,
      cet4Score: undefined,
      cet6Score: undefined,
    });
    setRecommendedUniversities([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // AI 对话助手生成的推荐：跳转并展示结果
  const handleAiRecommend = (data: UserData, universities: University[]) => {
    setUserData(data);
    setRecommendedUniversities(universities);
    setShowResults(true);
    if (cloudState !== 'offline') {
      void saveRecommendationRecord({
        undergraduateSchool: data.undergraduateSchool,
        targetMajor: data.targetMajor,
        totalScore: data.totalScore,
        englishScore: data.englishScore,
        mathScore: data.mathScore,
        cet4Score: data.cet4Score,
        cet6Score: data.cet6Score,
        universities,
      });
    }
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header cloudState={cloudState} />
      <AiChatWidget onShowRecommendations={handleAiRecommend} />
      
      <main>
        {!showResults ? (
          <>
            <HeroSection />
            <InputForm 
              onSubmit={handleFormSubmit} 
              loading={loading} 
              error={error}
            />
          </>
        ) : (
          <ResultsSection 
            userData={userData}
            universities={recommendedUniversities}
            onReset={handleReset}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
