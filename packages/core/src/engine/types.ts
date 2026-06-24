// ===== packages/core/src/engine/types.ts =====
/**
 * 引擎内部接口定义
 *
 * 这些接口抽象了 core 包对外部依赖（adapters, sites）的契约，
 * 避免 core 直接 import adapters/sites 包，解耦包之间的依赖关系。
 */

import type { DetectedField, MatchedField } from '@auto-form-filler/shared/types';
import type { FillConfig, PlatformAPI } from '@auto-form-filler/shared/types';
import type { ResumeData, FillStrategy } from '@auto-form-filler/shared/types';

/** 站点配置接口（core 不直接依赖 sites 包） */
export interface SiteConfig {
  readonly name: string;
  readonly domain: string;
  readonly urlPatterns: RegExp[];
  readonly framework: 'react' | 'vue' | 'angular' | 'native';
  readonly uiLibrary: string;
  getFormContainer?(): HTMLElement | null;
  applyFieldMappings?(fields: MatchedField[]): MatchedField[];
  beforeFill?(): Promise<void>;
  afterFill?(): Promise<void>;
}

/** 填充上下文（core 不直接依赖 adapters 包） */
export interface FillContext {
  field: DetectedField;
  value: unknown;
  resumeData: ResumeData;
  config: FillConfig;
  platform: PlatformAPI;
  signal?: AbortSignal;
}

/** 填充结果 */
export interface FillResult {
  success: boolean;
  fieldKey: string;
  duration: number;
  error?: string;
  strategy: FillStrategy;
}

/** 适配器接口（core 不直接依赖 adapters 包） */
export interface BaseAdapterLike {
  readonly capability: { name: string; framework: string; uiLibrary: string };
  hasValue(element: HTMLElement): boolean;
  fillField(context: FillContext): Promise<FillResult>;
  beforeFill?(context: {
    resumeData: ResumeData;
    config: FillConfig;
    platform: PlatformAPI;
    signal?: AbortSignal;
  }): Promise<void>;
  afterFill?(context: {
    resumeData: ResumeData;
    config: FillConfig;
    platform: PlatformAPI;
    signal?: AbortSignal;
  }): Promise<void>;
}
