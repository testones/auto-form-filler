// ===== packages/adapters/src/base/types.ts =====
// 适配器接口定义

import type { DetectedField } from '@auto-form-filler/shared/types';
import type { FillStrategy } from '@auto-form-filler/shared/types';
import type { FillConfig, PlatformAPI } from '@auto-form-filler/shared/types';
import type { ResumeData } from '@auto-form-filler/shared/types';

/** 适配器能力描述 */
export interface AdapterCapability {
  name: string;
  framework: 'react' | 'vue' | 'angular' | 'native';
  uiLibrary: string;
  versionRange?: string;
  supportedFieldTypes: string[];
}

/** 填充上下文 */
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
