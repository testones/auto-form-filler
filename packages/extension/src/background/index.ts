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

// 安装/更新时初始化默认简历数据
chrome.runtime.onInstalled.addListener(async () => {
  // 每次安装/更新都强制写入最新默认数据
  await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_RESUME });
  console.log('[AutoFormFiller] 简历数据已更新为最新默认值');
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
