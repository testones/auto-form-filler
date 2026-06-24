// ===== packages/extension/src/background/index.ts =====
/**
 * Background Service Worker
 *
 * 职责：
 * 1. 管理简历数据的存储
 * 2. 协调 popup ↔ content script 之间的消息通信
 * 3. 处理扩展图标点击事件
 */

// 简历数据存储 key
const STORAGE_KEY = 'resume_data';

// 默认简历数据
const DEFAULT_RESUME = {
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
      description: '负责抖音 Web 端核心功能开发，主导性能优化项目，页面加载速度提升 40%。',
      department: '前端架构组',
    },
  ],
  projectExperience: [
    {
      name: '抖音 Web 端重构',
      role: '前端负责人',
      description: '主导抖音 Web 端从 Vue2 迁移到 React18，构建组件库，提升开发效率 50%。',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 'expert' },
    { name: 'TypeScript', level: 'advanced' },
    { name: 'React', level: 'advanced' },
    { name: 'Vue', level: 'advanced' },
  ],
  additionalInfo: {
    selfIntro: '5年前端开发经验，精通 React/Vue 生态，有大型项目架构和性能优化经验，关注代码质量和团队协作。',
  },
};

// 安装时初始化默认简历数据
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_RESUME });
    console.log('[AutoFormFiller] 默认简历数据已初始化');
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_RESUME_DATA': {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        sendResponse({ success: true, data: data[STORAGE_KEY] || null });
        break;
      }

      case 'SAVE_RESUME_DATA': {
        await chrome.storage.local.set({ [STORAGE_KEY]: message.payload });
        sendResponse({ success: true });
        break;
      }

      case 'FILL_FORM': {
        // 向当前标签页的 content script 发送填充指令
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', payload: message.payload }, (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse(response);
            }
          });
        } else {
          sendResponse({ success: false, error: '未找到活动标签页' });
        }
        break;
      }

      case 'DETECT_SITE': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'DETECT_SITE' }, (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse(response);
            }
          });
        } else {
          sendResponse({ success: false, error: '未找到活动标签页' });
        }
        break;
      }

      case 'GET_TAB_INFO': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendResponse({ success: true, data: { url: tab?.url || '', title: tab?.title || '' } });
        break;
      }

      default:
        sendResponse({ success: false, error: `未知消息类型: ${message.type}` });
    }
  })();

  // 返回 true 表示异步响应
  return true;
});

export {};
