// ===== packages/extension/src/popup/stores/resume.ts =====
import { create } from 'zustand';
import type { ResumeData } from '@auto-form-filler/shared/types';

interface SiteInfo {
  name: string;
  framework: string;
  uiLibrary: string;
  url: string;
}

interface ResumeState {
  resumeData: ResumeData | null;
  siteInfo: SiteInfo | null;
  isFilling: boolean;
  fillProgress: { current: number; total: number; currentField: string; status: string } | null;
  fillResult: { success: boolean; report?: any; error?: string } | null;
  activeTab: 'fill' | 'basic' | 'education' | 'work';
  siteLoading: boolean;

  setActiveTab: (tab: 'fill' | 'basic' | 'education' | 'work') => void;
  loadResume: () => Promise<void>;
  saveResume: (data: ResumeData) => Promise<void>;
  updateResumeField: (path: string, value: unknown) => void;
  detectSite: () => Promise<void>;
  fillForm: () => Promise<void>;
  resetFillState: () => void;
}

// 发送消息给 background（带超时）
function sendMessage<T = any>(message: any, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, error: '请求超时' } as any);
      }
    }, timeoutMs);

    chrome.runtime.sendMessage(message, (response) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(response || { success: false, error: '无响应' });
      }
    });
  });
}

// 站点 URL 匹配（popup 内本地判断，不依赖 content script）
function matchSiteByUrl(url: string): SiteInfo | null {
  const rules = [
    { patterns: [/zhipin\.com/], name: 'BOSS直聘', framework: 'react', uiLibrary: 'custom' },
    { patterns: [/zhaopin\.com/], name: '智联招聘', framework: 'vue', uiLibrary: 'element-ui' },
    { patterns: [/liepin\.com/], name: '猎聘', framework: 'react', uiLibrary: 'ant-design' },
    { patterns: [/51job\.com/], name: '前程无忧', framework: 'vue', uiLibrary: 'custom' },
    { patterns: [/lagou\.com/], name: '拉勾网', framework: 'react', uiLibrary: 'custom' },
  ];

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(url)) {
        return { name: rule.name, framework: rule.framework, uiLibrary: rule.uiLibrary, url };
      }
    }
  }
  return null;
}

const DEFAULT_RESUME: ResumeData = {
  basicInfo: {
    name: '张三',
    gender: 'female',
    birthDate: '1995-05',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    currentCity: '大同',
    politicalStatus: '中共党员',
    hometown: '山西',
    wechat: 'zhangsan123',
    qq: '123456789',
    ethnicity: '汉族',
    maritalStatus: '未婚',
    height: 175,
    weight: 65,
    address: '北京市',
  },
  jobPreference: {
    jobTitle: 'Node.js工程师',
    expectedCities: ['包头'],
    expectedSalary: '10000-20000',
    jobType: 'fulltime',
    jobStatus: '离职找工作',
    industry: '旅游',
    availableDate: '一周内',
  },
  education: [
    { school: '清华大学', degree: 'bachelor', major: '计算机科学与技术', startDate: '2013-09', endDate: '2017-07' },
    { school: '北京大学', degree: 'doctor', major: '经济学', startDate: '2022-02', endDate: '2026-05' },
  ],
  workExperience: [
    { company: '阿里巴巴', title: '软件工程师', startDate: '2017-07', endDate: '2022-08', description: '系统开发与维护', department: '技术部' },
  ],
  projectExperience: [
    { name: '智能客服系统', role: '项目经理', description: '开发智能客服系统' },
  ],
  skills: [
    { name: 'JavaScript', level: 'expert' },
    { name: 'Node.js', level: 'advanced' },
    { name: '项目管理', level: 'intermediate' },
  ],
  additionalInfo: {
    selfIntro: '工作认真负责，学习能力强，具备良好的团队合作精神。',
    hobbies: '阅读、运动',
  },
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumeData: null,
  siteInfo: null,
  isFilling: false,
  fillProgress: null,
  fillResult: null,
  activeTab: 'fill',
  siteLoading: true,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadResume: async () => {
    const response = await sendMessage<{ success: boolean; data: ResumeData | null }>({
      type: 'GET_RESUME_DATA',
    });
    if (response?.success && response.data) {
      set({ resumeData: response.data });
    } else {
      set({ resumeData: DEFAULT_RESUME });
    }
  },

  saveResume: async (data) => {
    await sendMessage({ type: 'SAVE_RESUME_DATA', payload: data });
    set({ resumeData: data });
  },

  updateResumeField: (path, value) => {
    const current = get().resumeData;
    if (!current) return;
    const updated = JSON.parse(JSON.stringify(current));
    const parts = path.split('.');
    let obj = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    set({ resumeData: updated });
    get().saveResume(updated);
  },

  detectSite: async () => {
    set({ siteLoading: true });

    // 先用 tab URL 本地匹配（快速，不依赖 content script）
    const tabResponse = await sendMessage<{ success: boolean; data: { url: string } }>({
      type: 'GET_TAB_INFO',
    });

    if (tabResponse?.success && tabResponse.data?.url) {
      const url = tabResponse.data.url;
      const localMatch = matchSiteByUrl(url);
      if (localMatch) {
        set({ siteInfo: localMatch, siteLoading: false });
        return;
      }
    }

    // 本地没匹配到，尝试让 content script 检测框架
    const response = await sendMessage<{ success: boolean; data: any }>({
      type: 'DETECT_SITE',
    }, 8000); // 8秒超时

    if (response?.success && response.data) {
      const url = response.data.url || tabResponse?.data?.url || '';
      const localMatch = matchSiteByUrl(url);
      set({
        siteInfo: localMatch || {
          name: '不支持',
          framework: response.data.framework || 'unknown',
          uiLibrary: response.data.uiLibrary || 'unknown',
          url,
        },
        siteLoading: false,
      });
    } else {
      set({ siteLoading: false });
    }
  },

  fillForm: async () => {
    const { resumeData } = get();
    if (!resumeData) return;

    set({ isFilling: true, fillProgress: null, fillResult: null });

    // 监听进度
    const progressHandler = (message: any) => {
      if (message.type === 'FILL_PROGRESS') {
        set({ fillProgress: message.payload });
      }
    };
    chrome.runtime.onMessage.addListener(progressHandler);

    const response = await sendMessage<{ success: boolean; report?: any; error?: string }>({
      type: 'FILL_FORM',
      payload: resumeData,
    }, 60000); // 填充超时 60 秒

    chrome.runtime.onMessage.removeListener(progressHandler);

    set({
      isFilling: false,
      fillResult: response,
    });
  },

  resetFillState: () => set({ fillProgress: null, fillResult: null }),
}));
