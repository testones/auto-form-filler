// ===== packages/extension/src/content/index.ts =====
/**
 * Content Script
 *
 * 运行在招聘网站页面的隔离世界中。
 * 支持 iframe（all_frames: true），每个 frame 都会注入。
 */

// 注入脚本到页面主世界
function injectScript(): void {
  // 避免重复注入
  if ((window as any).__autoFormFillerInjected) return;
  (window as any).__autoFormFillerInjected = true;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => {
    console.log('[AutoFormFiller] 注入脚本已加载', location.href);
    window.postMessage({ source: 'auto-form-filler-content', type: 'SCRIPT_READY' }, '*');
  };
  script.onerror = () => {
    console.error('[AutoFormFiller] 注入脚本加载失败', location.href);
  };
  (document.head || document.documentElement).appendChild(script);
}

// 延迟注入，确保 DOM 就绪
function tryInject() {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectScript();
  } else {
    window.addEventListener('DOMContentLoaded', injectScript, { once: true });
  }
}

// 智联等 SPA 站点可能动态切换路由，需要持续监听
let injectTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleReinject() {
  if (injectTimer) clearTimeout(injectTimer);
  injectTimer = setTimeout(() => {
    if (!(window as any).__autoFormFillerInjected) {
      injectScript();
    }
  }, 2000);
}

tryInject();

// 监听 URL 变化（SPA 路由切换）
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('[AutoFormFiller] URL 变化:', lastUrl);
    // 重置注入状态，重新注入
    (window as any).__autoFormFillerInjected = false;
    tryInject();
  }
});
urlObserver.observe(document.documentElement, { childList: true, subtree: true });

// 监听来自 background/popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_FORM') {
    // 检查注入脚本是否就绪
    if (!(window as any).__autoFormFillerInjected) {
      injectScript();
    }

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
        // 检查是否有表单元素（即使注入脚本没就绪）
        const hasForm = document.querySelector('input, textarea, select, .el-input, .el-select, .ant-input, .ant-select');
        sendResponse({
          success: false,
          error: hasForm
            ? '注入脚本未响应，可能页面框架拦截了消息。请刷新页面后重试。'
            : '当前页面未检测到表单元素，请确保在简历编辑页面。',
        });
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
  const hasReact = !!(
    document.querySelector('[data-reactroot]') ||
    document.querySelector('[data-reactid]') ||
    document.querySelector('#root')?.children.length
  );

  // 检测 Vue
  const appEl = document.querySelector('#app, [data-v-app]');
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

console.log('[AutoFormFiller] content script 已加载', location.href);
