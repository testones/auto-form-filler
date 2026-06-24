// ===== packages/sites/src/base/types.ts =====
// 站点配置类型定义

import type { MatchedField } from '@auto-form-filler/shared/types';

/** 字段选择器配置 */
export interface FieldSelectorConfig {
  selector: string;
  type?: string;
  componentClass?: string;
  /** 值的转换函数名 */
  valueTransform?: string;
  /** 额外的填充选项 */
  fillOptions?: Record<string, unknown>;
}

/** 站点配置接口 */
export interface SiteConfig {
  /** 站点名称 */
  readonly name: string;
  /** 域名 */
  readonly domain: string;
  /** URL 匹配规则 */
  readonly urlPatterns: RegExp[];
  /** 使用的 UI 框架 */
  readonly framework: 'react' | 'vue' | 'angular' | 'native';
  /** 使用的 UI 库 */
  readonly uiLibrary: string;
  /** 字段选择器映射 */
  readonly fieldSelectors: Record<string, string | FieldSelectorConfig>;

  /** 获取表单容器 */
  getFormContainer(): HTMLElement | null;

  /** 自定义字段映射（站点特殊处理） */
  applyFieldMappings?(fields: MatchedField[]): MatchedField[];

  /** 预处理 */
  beforeFill?(): Promise<void>;

  /** 后处理 */
  afterFill?(): Promise<void>;
}
