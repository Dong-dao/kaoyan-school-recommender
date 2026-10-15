export type UserData = {
  undergraduateSchool: string;
  targetMajor: string;
  englishScore: number;
  mathScore: number;
  totalScore: number;
  cet4Score?: number;
  cet6Score?: number;
};

export type University = {
  id: string;
  name: string;
  level: string;
  tier: '冲' | '稳' | '保';
  majorType: '学硕' | '专硕' | '专业组';
  minScore: number;
  avgScore: number;
  maxScore: number;
  admissionRate: number;
  location: string;
  officialWebsite: string;
  logo?: string;
  description?: string;
};