// ===== packages/adapters/src/base/BaseAdapter.ts =====
/**
 * 抽象适配器基类
 *
 * 所有框架/UI库适配器都继承此类。
 * 定义了适配器的标准接口和通用行为。
 */

import type { DetectedField } from '@auto-form-filler/shared/types';
import { FillStrategy } from '@auto-form-filler/shared/types';
import type { ResumeData, FillConfig, PlatformAPI } from '@auto-form-filler/shared/types';
import type { AdapterCapability, FillContext, FillResult } from './types.js';

export abstract class BaseAdapter {
  /** 适配器能力描述（子类必须实现） */
  abstract readonly capability: AdapterCapability;

  /**
   * 检测当前页面是否使用此适配器对应的 UI 框架
   */
  abstract detect(document: Document): boolean;

  /**
   * 填充单个字段（子类必须实现）
   */
  abstract fillField(context: FillContext): Promise<FillResult>;

  /**
   * 预处理（在批量填充前执行）
   * 例如：展开折叠的表单区域、等待异步组件加载
   */
  async beforeFill?(context: {
    resumeData: ResumeData;
    config: FillConfig;
    platform: PlatformAPI;
    signal?: AbortSignal;
  }): Promise<void>;

  /**
   * 后处理（在批量填充后执行）
   * 例如：触发表单校验、自动保存
   */
  async afterFill?(context: {
    resumeData: ResumeData;
    config: FillConfig;
    platform: PlatformAPI;
    signal?: AbortSignal;
  }): Promise<void>;

  /**
   * 获取字段的当前值
   */
  abstract getFieldValue(element: HTMLElement): unknown;

  /**
   * 判断字段是否已有值
   */
  hasValue(element: HTMLElement): boolean {
    const value = this.getFieldValue(element);
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  /** 滚动元素到视口 */
  protected scrollIntoView(element: HTMLElement): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** 高亮元素（填充反馈） */
  protected highlight(element: HTMLElement, color: string, duration = 2000): void {
    const originalOutline = element.style.outline;
    const originalTransition = element.style.transition;
    const originalBoxShadow = element.style.boxShadow;

    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = `0 0 0 3px ${color}`;
    element.style.outline = 'none';

    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.transition = originalTransition;
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  }

  /** 等待指定时间 */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** 创建成功结果 */
  protected successResult(fieldKey: string, duration: number, strategy: FillStrategy): FillResult {
    return { success: true, fieldKey, duration, strategy };
  }

  /** 创建失败结果 */
  protected errorResult(
    fieldKey: string,
    duration: number,
    error: string,
    strategy: FillStrategy
  ): FillResult {
    return { success: false, fieldKey, duration, error, strategy };
  }
}
