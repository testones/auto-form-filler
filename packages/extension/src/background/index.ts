// ===== packages/extension/src/background/index.ts =====
/**
 * Background Service Worker
 *
 * 职责：
 * 1. 管理简历数据的存储
 * 2. 协调 popup ↔ content script 之间的消息通信
 * 3. content script 未就绪时自动重试
 */

const STORAGE_KEY = 'resume_data';

const DEFAULT_RESUME = {
  basicInfo: {
    name: '张三',
    gender: 'male',
    birthDate: '1995-06',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    currentCity: '成都',
    politicalStatus: '群众',
    hometown: '四川',
  },
  jobPreference: {
    jobTitle: '前端开发工程师',
    expectedCities: ['成都'],
    expectedSalary: '20k-30k',
    jobType: 'fulltime',
    jobStatus: '离职-随时到岗',
    industry: '互联网',
  },
  education: [
    { school: '北京理工大学', degree: 'bachelor', major: '计算机科学与技术', startDate: '2013-09', endDate: '2017-06' },
  ],
  workExperience: [
    { company: '字节跳动', title: '高级前端工程师', startDate: '2020-07', endDate: 'present', description: '负责抖音 Web 端核心功能开发', department: '前端架构组' },
  ],
  projectExperience: [
    { name: '抖音 Web 端重构', role: '前端负责人', description: '主导抖音 Web 端从 Vue2 迁移到 React18' },
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

// 安装/更新时初始化默认简历数据
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const data = stored[STORAGE_KEY];

  // 如果没有数据，或者缺少新增字段，用默认数据覆盖
  const needsUpdate = !data ||
    !data.basicInfo?.politicalStatus ||
    !data.basicInfo?.hometown ||
    !data.jobPreference?.jobStatus ||
    !data.jobPreference?.industry;

  if (needsUpdate) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_RESUME });
    console.log('[AutoFormFiller] 简历数据已更新为最新默认值');
  }
});

/**
 * 向 content script 发送消息，支持重试
 * content script 可能还没注入完成，需要等待重试
 */
async function sendToContentScript(tabId: number, message: any, maxRetries = 5): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      return response;
    } catch (err) {
      // content script 还没准备好，等待后重试
      console.log(`[AutoFormFiller] 等待 content script 就绪... (${i + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('content script 未响应，请刷新页面后重试');
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
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
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            sendResponse({ success: false, error: '未找到活动标签页' });
            break;
          }
          try {
            const response = await sendToContentScript(tab.id, { type: 'FILL_FORM', payload: message.payload });
            sendResponse(response);
          } catch (err) {
            sendResponse({ success: false, error: (err as Error).message });
          }
          break;
        }

        case 'DETECT_SITE': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            sendResponse({ success: false, error: '未找到活动标签页' });
            break;
          }
          try {
            const response = await sendToContentScript(tab.id, { type: 'DETECT_SITE' });
            sendResponse(response);
          } catch (err) {
            // content script 没响应，用 URL 直接判断
            const url = tab.url || '';
            sendResponse({
              success: true,
              data: { framework: 'unknown', uiLibrary: 'unknown', url },
            });
          }
          break;
        }

        case 'GET_TAB_INFO': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse({ success: true, data: { url: tab?.url || '', title: tab?.title || '' } });
          break;
        }

        // 转发进度信息给 popup
        case 'FILL_PROGRESS': {
          // 广播给所有 popup（如果有打开的话）
          chrome.runtime.sendMessage(message).catch(() => {
            // popup 可能没开，忽略错误
          });
          break;
        }

        default:
          sendResponse({ success: false, error: `未知消息类型: ${message.type}` });
      }
    } catch (err) {
      sendResponse({ success: false, error: (err as Error).message });
    }
  })();

  return true; // 异步响应
});

export {};
