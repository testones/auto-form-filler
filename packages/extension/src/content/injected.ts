// ===== packages/extension/src/content/injected.ts =====
/**
 * 注入脚本（运行在页面主世界 Main World）
 *
 * 这是实际执行表单填充的脚本，运行在页面的 JavaScript 上下文中，
 * 可以正确触发 React/Vue 等框架的事件系统。
 *
 * 通信流程：
 *   popup → background → content script → [postMessage] → injected script
 *                                                      ↓
 *   popup ← background ← content script ← [postMessage] ← injected script
 */

import { FormFiller } from '@auto-form-filler/core';
import { Logger } from '@auto-form-filler/core';
import type { FillProgress } from '@auto-form-filler/shared/types';
import type { ResumeData } from '@auto-form-filler/shared/types';

// 创建一个简单的 PlatformAPI 实现
const platformAPI = {
  storage: {
    async get<T>(key: string): Promise<T | null> {
      return new Promise((resolve) => {
        // 从 content script 获取数据
        window.postMessage(
          { source: 'auto-form-filler-injected', type: 'GET_STORAGE', key },
          '*'
        );
        const handler = (event: MessageEvent) => {
          if (event.data?.source === 'auto-form-filler-content' &&
              event.data?.type === 'STORAGE_DATA' &&
              event.data?.key === key) {
            window.removeEventListener('message', handler);
            resolve(event.data.value as T);
          }
        };
        window.addEventListener('message', handler);
        setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve(null);
        }, 3000);
      });
    },
    async set<T>(_key: string, _value: T): Promise<void> {},
    async remove(_key: string): Promise<void> {},
    async clear(): Promise<void> {},
  },
  fileReader: {
    async readAsDataURL(blob: Blob): Promise<string> {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    },
    async readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      });
    },
  },
  http: {
    async get(url: string): Promise<Response> { return fetch(url); },
    async post(url: string, data: unknown): Promise<Response> {
      return fetch(url, { method: 'POST', body: JSON.stringify(data) });
    },
  },
  logger: {
    info: (msg: string, ...args: unknown[]) => console.log('%c[AutoFormFiller]', 'color:#1890ff;font-weight:bold', msg, ...args),
    warn: (msg: string, ...args: unknown[]) => console.warn('[AutoFormFiller]', msg, ...args),
    error: (msg: string, ...args: unknown[]) => console.error('[AutoFormFiller]', msg, ...args),
    debug: (msg: string, ...args: unknown[]) => console.debug('[AutoFormFiller]', msg, ...args),
  },
  notification: {
    show(title: string, message: string) {
      console.log(`[AutoFormFiller] ${title}: ${message}`);
    },
  },
};

// 动态导入适配器和站点注册表（避免循环依赖）
let fillerInstance: FormFiller | null = null;

async function getFiller(): Promise<FormFiller> {
  if (fillerInstance) return fillerInstance;

  // 动态导入，确保在页面上下文中执行
  const [{ AdapterRegistry }, { SiteRegistry }] = await Promise.all([
    import('@auto-form-filler/adapters'),
    import('@auto-form-filler/sites'),
  ]);

  const adapterRegistry = AdapterRegistry.getInstance();
  const siteRegistry = SiteRegistry.getInstance();

  fillerInstance = new FormFiller(
    siteRegistry,
    adapterRegistry,
    {
      actionDelay: 150,
      enableAnimation: true,
      highlightFilled: true,
      highlightColor: '#52c41a',
      maxRetries: 2,
      skipFilled: false,
    },
    platformAPI
  );

  return fillerInstance;
}

// 监听来自 content script 的消息
window.addEventListener('message', async (event) => {
  // 只接受来自 content script 的消息
  if (event.data?.source !== 'auto-form-filler-content') return;

  if (event.data.type === 'FILL_FORM') {
    const resumeData = event.data.resumeData as ResumeData;
    Logger.info('收到填充请求，开始处理...');

    try {
      const filler = await getFiller();

      const report = await filler.fill(resumeData, {
        onProgress: (progress: FillProgress) => {
          // 向 content script 报告进度
          window.postMessage(
            { source: 'auto-form-filler-injected', type: 'FILL_PROGRESS', progress },
            '*'
          );
        },
      });

      Logger.info(`填充完成: 成功 ${report.filledCount}/${report.totalFields}，跳过 ${report.skippedCount}，失败 ${report.failedCount}`);

      // 返回最终结果
      window.postMessage(
        {
          source: 'auto-form-filler-injected',
          type: 'FILL_RESULT',
          result: { success: true, report },
        },
        '*'
      );
    } catch (error) {
      Logger.error('填充失败:', error);
      window.postMessage(
        {
          source: 'auto-form-filler-injected',
          type: 'FILL_RESULT',
          result: { success: false, error: (error as Error).message },
        },
        '*'
      );
    }
  }

  // 响应 storage 请求
  if (event.data.type === 'GET_STORAGE') {
    // injected script 无法直接访问 chrome.storage，回退到 localStorage
    const value = localStorage.getItem(event.data.key);
    window.postMessage(
      {
        source: 'auto-form-filler-content',
        type: 'STORAGE_DATA',
        key: event.data.key,
        value: value ? JSON.parse(value) : null,
      },
      '*'
    );
  }
});

// 通知 content script 注入脚本已就绪
window.postMessage(
  { source: 'auto-form-filler-injected', type: 'INJECTED_READY' },
  '*'
);

console.log('%c[简历自动填充助手] 已注入页面', 'color:#52c41a;font-weight:bold;font-size:14px');
