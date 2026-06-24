// ===== packages/extension/src/content/index.ts =====
/**
 * Content Script
 *
 * 运行在招聘网站页面的隔离世界中。
 * 注意：不能用 ES module import/export，因为 Chrome MV3 content script 不支持 ESM
 * Vite 构建时会以 IIFE 格式打包
 */

// 注入脚本到页面主世界
function injectScript(): void {
  // 避免重复注入
  if ((window as any).__autoFormFillerInjected) return;
  (window as any).__autoFormFillerInjected = true;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => {
    console.log('[AutoFormFiller] 注入脚本已加载');
    window.postMessage({ source: 'auto-form-filler-content', type: 'SCRIPT_READY' }, '*');
  };
  script.onerror = () => {
    console.error('[AutoFormFiller] 注入脚本加载失败');
  };
  (document.head || document.documentElement).appendChild(script);
}

// 页面加载完成后注入
if (document.readyState === 'complete' || document.readyState === 'idle') {
  injectScript();
} else {
  window.addEventListener('DOMContentLoaded', injectScript);
}

// 标记 content script 已就绪
const contentReady = true;

// 监听来自 background/popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_FORM') {
    // 转发给注入脚本
    window.postMessage(
      { source: 'auto-form-filler-content', type: 'FILL_FORM', resumeData: message.payload },
      '*'
    );

    // 等待注入脚本的回复（超时 30 秒）
    let responded = false;
    const handler = (event: MessageEvent) => {
      if (event.data?.source === 'auto-form-filler-injected' && event.data?.type === 'FILL_RESULT') {
        window.removeEventListener('message', handler);
        responded = true;
        sendResponse(event.data.result);
      }
    };
    window.addEventListener('message', handler);

    // 超时处理
    setTimeout(() => {
      if (!responded) {
        window.removeEventListener('message', handler);
        sendResponse({ success: false, error: '填充超时 - 注入脚本可能未正确加载' });
      }
    }, 30000);

    return true; // 异步响应
  }

  if (message.type === 'DETECT_SITE') {
    try {
      const detected = detectFramework();
      sendResponse({ success: true, data: detected });
    } catch (err) {
      sendResponse({ success: true, data: { framework: 'unknown', uiLibrary: 'unknown', url: location.href } });
    }
  }
});

// 监听注入脚本返回的进度信息，转发给 background
window.addEventListener('message', (event) => {
  if (event.data?.source === 'auto-form-filler-injected') {
    if (event.data.type === 'FILL_PROGRESS') {
      chrome.runtime.sendMessage({
        type: 'FILL_PROGRESS',
        payload: event.data.progress,
      }).catch(() => {});
    }
  }
});

/** 检测当前页面使用的框架 */
function detectFramework(): { framework: string; uiLibrary: string; url: string } {
  const url = window.location.href;

  // 检测 React
  const rootEl = document.querySelector('#root');
  const hasReact = !!(
    document.querySelector('[data-reactroot]') ||
    document.querySelector('[data-reactid]') ||
    rootEl?.children.length > 0
  );

  // 检测 Vue
  const appEl = document.querySelector('#app');
  const hasVue = !!(
    document.querySelector('[data-v-app]') ||
    (appEl as any)?.__vue_app__ ||
    document.querySelector('[data-v-]') ||
    document.querySelector('.v-application')
  );

  // 检测 Ant Design
  const hasAntd = !!document.querySelector('.ant-btn, .ant-form, .ant-input, .ant-select, .ant-picker');

  // 检测 Element UI
  const hasElement = !!document.querySelector('.el-button, .el-form, .el-input, .el-select, .el-date-editor');

  let framework = 'unknown';
  let uiLibrary = 'unknown';

  if (hasAntd) {
    framework = 'react';
    uiLibrary = 'ant-design';
  } else if (hasElement) {
    framework = 'vue';
    uiLibrary = 'element-ui';
  } else if (hasReact) {
    framework = 'react';
    uiLibrary = 'custom';
  } else if (hasVue) {
    framework = 'vue';
    uiLibrary = 'custom';
  }

  return { framework, uiLibrary, url };
}

// 通知 background content script 已就绪
console.log('[AutoFormFiller] content script 已加载');
