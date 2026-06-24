// ===== packages/extension/src/popup/stores/resume.ts =====
import { create } from 'zustand';
import type { ResumeData } from '@auto-form-filler/shared/types';

interface ResumeState {
  // 简历数据
  resumeData: ResumeData | null;
  // 站点信息
  siteInfo: { name: string; framework: string; uiLibrary: string; url: string } | null;
  // 填充状态
  isFilling: boolean;
  fillProgress: { current: number; total: number; currentField: string; status: string } | null;
  fillResult: { success: boolean; report?: any; error?: string } | null;
  // UI 状态
  activeTab: 'fill' | 'basic' | 'education' | 'work';
  siteLoading: boolean;

  // Actions
  setActiveTab: (tab: 'fill' | 'basic' | 'education' | 'work') => void;
  loadResume: () => Promise<void>;
  saveResume: (data: ResumeData) => Promise<void>;
  updateResumeField: (path: string, value: unknown) => void;
  detectSite: () => Promise<void>;
  fillForm: () => Promise<void>;
  resetFillState: () => void;
}

// 发送消息给 background
function sendMessage<T = any>(message: any): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

// 默认简历数据
const DEFAULT_RESUME: ResumeData = {
  basicInfo: {
    name: '张三',
    gender: 'male',
    birthDate: '1995-06-15',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    currentCity: '北京',
  },
  jobPreference: {
    jobTitle: '前端开发工程师',
    expectedCities: ['北京'],
    expectedSalary: '20k-30k',
    jobType: 'fulltime',
  },
  education: [
    {
      school: '北京理工大学',
      degree: 'bachelor',
      major: '计算机科学与技术',
      startDate: '2013-09',
      endDate: '2017-06',
    },
  ],
  workExperience: [
    {
      company: '字节跳动',
      title: '高级前端工程师',
      startDate: '2020-07',
      endDate: 'present',
      description: '负责抖音 Web 端核心功能开发',
      department: '前端架构组',
    },
  ],
  projectExperience: [
    {
      name: '抖音 Web 端重构',
      role: '前端负责人',
      description: '主导抖音 Web 端从 Vue2 迁移到 React18',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 'expert' },
    { name: 'TypeScript', level: 'advanced' },
    { name: 'React', level: 'advanced' },
  ],
  additionalInfo: {
    selfIntro: '5年前端开发经验，精通 React/Vue 生态。',
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
    const response = await sendMessage<{ success: boolean; data: any }>({
      type: 'DETECT_SITE',
    });
    if (response?.success) {
      // 匹配站点注册表
      const { SiteRegistry } = require('@auto-form-filler/sites');
      const registry = SiteRegistry.getInstance();
      const siteConfig = registry.match(response.data.url);
      set({
        siteInfo: siteConfig
          ? { name: siteConfig.name, framework: siteConfig.framework, uiLibrary: siteConfig.uiLibrary, url: response.data.url }
          : { name: '不支持', framework: response.data.framework, uiLibrary: response.data.uiLibrary, url: response.data.url },
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
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'FILL_PROGRESS') {
        set({ fillProgress: message.payload });
      }
    });

    const response = await sendMessage<{ success: boolean; report?: any; error?: string }>({
      type: 'FILL_FORM',
      payload: resumeData,
    });

    set({
      isFilling: false,
      fillResult: response,
    });
  },

  resetFillState: () => set({ fillProgress: null, fillResult: null }),
}));
