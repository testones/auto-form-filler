// ===== packages/extension/src/content/index.ts =====
/**
 * Content Script
 *
 * 运行在招聘网站页面的隔离世界中。
 * 职责：
 * 1. 接收来自 popup/background 的消息
 * 2. 将 injected.js 注入到页面的主世界中执行（因为 React/Vue 的事件系统在主世界）
 * 3. 转发消息和结果
 */

// 注入脚本到页面主世界
function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.type = 'module';
  script.onload = () => {
    console.log('[AutoFormFiller] 注入脚本已加载');
    // 通知注入脚本已就绪
    window.postMessage({ source: 'auto-form-filler-content', type: 'SCRIPT_READY' }, '*');
  };
  (document.head || document.documentElement).appendChild(script);
}

// 页面加载完成后注入
if (document.readyState === 'complete' || document.readyState === 'idle') {
  injectScript();
} else {
  window.addEventListener('DOMContentLoaded', injectScript);
}

// 监听来自 background/popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_FORM') {
    // 转发给注入脚本
    window.postMessage(
      { source: 'auto-form-filler-content', type: 'FILL_FORM', resumeData: message.payload },
      '*'
    );

    // 等待注入脚本的回复
    const handler = (event: MessageEvent) => {
      if (event.data?.source === 'auto-form-filler-injected' && event.data?.type === 'FILL_RESULT') {
        window.removeEventListener('message', handler);
        sendResponse(event.data.result);
      }
    };
    window.addEventListener('message', handler);

    // 超时处理（30秒）
    setTimeout(() => {
      window.removeEventListener('message', handler);
      sendResponse({ success: false, error: '填充超时' });
    }, 30000);

    return true; // 异步响应
  }

  if (message.type === 'DETECT_SITE') {
    // 检测当前页面使用的框架
    const detected = detectFramework();
    sendResponse({ success: true, data: detected });
  }
});

// 监听注入脚本返回的进度信息，转发给 popup
window.addEventListener('message', (event) => {
  if (event.data?.source === 'auto-form-filler-injected') {
    if (event.data.type === 'FILL_PROGRESS') {
      // 通过 background 中转进度
      chrome.runtime.sendMessage({
        type: 'FILL_PROGRESS',
        payload: event.data.progress,
      });
    }
  }
});

/** 检测当前页面使用的框架 */
function detectFramework(): { framework: string; uiLibrary: string; url: string } {
  const url = window.location.href;

  // 检测 React
  const hasReact = !!(document.querySelector('[data-reactroot]') ||
    document.querySelector('#root') ||
    (window as any).React);

  // 检测 Vue
  const hasVue = !!(document.querySelector('[data-v-app]') ||
    document.querySelector('#app')?.__vue_app__ ||
    (window as any).Vue);

  // 检测 Ant Design
  const hasAntd = !!document.querySelector('.ant-btn, .ant-form, .ant-input, .ant-select');

  // 检测 Element UI
  const hasElement = !!document.querySelector('.el-button, .el-form, .el-input, .el-select');

  let framework = 'unknown';
  let uiLibrary = 'unknown';

  if (hasReact) framework = 'react';
  else if (hasVue) framework = 'vue';

  if (hasAntd) uiLibrary = 'ant-design';
  else if (hasElement) uiLibrary = 'element-ui';
  else uiLibrary = 'custom';

  return { framework, uiLibrary, url };
}

export {};
