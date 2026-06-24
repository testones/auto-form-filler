// ===== packages/sites/src/base/BaseSiteConfig.ts =====
/**
 * 站点配置基类
 */

import type { MatchedField } from '@auto-form-filler/shared/types';
import type { SiteConfig, FieldSelectorConfig } from './types.js';

export abstract class BaseSiteConfig implements SiteConfig {
  abstract readonly name: string;
  abstract readonly domain: string;
  abstract readonly urlPatterns: RegExp[];
  abstract readonly framework: 'react' | 'vue' | 'angular' | 'native';
  abstract readonly uiLibrary: string;
  abstract readonly fieldSelectors: Record<string, string | FieldSelectorConfig>;

  getFormContainer(): HTMLElement | null {
    // 默认返回 document.body，子类可以重写
    return document.body;
  }

  applyFieldMappings?(fields: MatchedField[]): MatchedField[] {
    // 默认直接返回
    return fields;
  }

  async beforeFill?(): Promise<void> {
    // 默认不做预处理
  }

  async afterFill?(): Promise<void> {
    // 默认不做后处理
  }

  /** 工具方法：等待元素出现 */
  protected async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing as HTMLElement);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(el as HTMLElement);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /** 工具方法：延迟 */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
