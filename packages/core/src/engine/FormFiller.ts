// ===== packages/core/src/engine/FormFiller.ts =====
/**
 * 表单填充主引擎
 *
 * 整合站点识别 → 适配器选择 → 字段检测 → 字段匹配 → 批量填充 → 进度报告
 * 是整个系统的核心入口类。
 */

import type { ResumeData } from '@auto-form-filler/shared/types';
import type { FillConfig, PlatformAPI } from '@auto-form-filler/shared/types';
import { DEFAULT_FILL_CONFIG } from '@auto-form-filler/shared/types';
import { FillStrategy } from '@auto-form-filler/shared/types';
import type { MatchedField } from '@auto-form-filler/shared/types';
import type { DetectedField, FillProgress, FillCompleteReport } from '@auto-form-filler/shared/types';

import { FieldDetector } from '../field/FieldDetector.js';
import { FieldMatcher } from './FieldMatcher.js';
import { ActionQueue } from './ActionQueue.js';
import type { QueuedAction } from './ActionQueue.js';
import { Logger } from '../utils/logger.js';

// 以下接口通过依赖注入传入，避免 core 直接依赖 adapters/sites 包
// 实际运行时由上层（extension/userscript）注入具体实现
import type { FillContext, FillResult as AdapterFillResult, BaseAdapterLike, SiteConfig as GenericSiteConfig } from './types.js';

export interface FillOptions {
  /** 进度回调 */
  onProgress?: (progress: FillProgress) => void;
  /** 完成回调 */
  onComplete?: (report: FillCompleteReport) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 中止信号 */
  signal?: AbortSignal;
}

export interface FillReport {
  totalFields: number;
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  totalDuration: number;
  details: FillDetail[];
  site: {
    name: string;
    url: string;
    framework: string;
    uiLibrary: string;
  };
}

export interface FillDetail {
  fieldLabel: string;
  fieldKey: string;
  success: boolean;
  strategy: FillStrategy;
  error?: string;
}

/**
 * FormFiller 主引擎
 *
 * 使用示例：
 * ```typescript
 * const filler = new FormFiller(siteRegistry, adapterRegistry, config, platform);
 * const report = await filler.fill(resumeData, {
 *   onProgress: (p) => console.log(`${p.current}/${p.total}: ${p.currentField}`),
 * });
 * ```
 */
export class FormFiller {
  private fieldDetector: FieldDetector;
  private fieldMatcher: FieldMatcher;
  private actionQueue: ActionQueue;
  private aborted = false;

  constructor(
    private siteRegistry: { match(url: string): GenericSiteConfig | null },
    private adapterRegistry: { getAdapter(framework: string, uiLibrary: string): BaseAdapterLike | null },
    private config: FillConfig = DEFAULT_FILL_CONFIG,
    private platform: PlatformAPI
  ) {
    this.fieldDetector = new FieldDetector();
    this.fieldMatcher = new FieldMatcher();
    this.actionQueue = new ActionQueue();
  }

  /**
   * 主入口：自动检测并填充表单
   */
  async fill(resumeData: ResumeData, options: FillOptions = {}): Promise<FillReport> {
    const startTime = Date.now();
    this.aborted = false;

    // 监听中止信号
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        this.aborted = true;
        this.actionQueue.abort();
      });
    }

    try {
      // Step 1: 识别站点
      Logger.info('Step 1: Detecting site...');
      const siteConfig = this.siteRegistry.match(window.location.href);
      if (!siteConfig) {
        throw new Error(`Unsupported site: ${window.location.href}`);
      }
      Logger.info(`Site detected: ${siteConfig.name} (${siteConfig.framework}/${siteConfig.uiLibrary})`);

      // Step 2: 确定适配器
      Logger.info('Step 2: Selecting adapter...');
      const adapter = this.adapterRegistry.getAdapter(siteConfig.framework, siteConfig.uiLibrary);
      if (!adapter) {
        throw new Error(`No adapter found for ${siteConfig.framework}/${siteConfig.uiLibrary}`);
      }
      Logger.info(`Adapter selected: ${adapter.capability.name}`);

      // Step 3: 预处理（先点击编辑按钮等，再检测字段）
      Logger.info('Step 3: Pre-fill processing...');
      await siteConfig.beforeFill?.();
      await adapter.beforeFill?.({
        resumeData,
        config: this.config,
        platform: this.platform,
      });

      // Step 4: 检测表单字段
      Logger.info('Step 4: Detecting form fields...');
      let formContainer = siteConfig.getFormContainer?.() ?? document.body;
      Logger.info(`Form container:`, formContainer.tagName, formContainer.className);

      let detectedFields = this.fieldDetector.detectInContainer(formContainer);

      // 如果容器内没找到字段，回退到 document.body 扫描全页
      if (detectedFields.length === 0) {
        Logger.warn(`容器内未检测到字段，回退到全页扫描...`);
        formContainer = document.body;
        detectedFields = this.fieldDetector.detectInContainer(formContainer);
      }

      Logger.info(`Detected ${detectedFields.length} fields`);

      // 调试：打印所有检测到的字段
      detectedFields.forEach((f, i) => {
        Logger.info(
          `  [${i}] type=${f.fieldType} label="${f.label}" placeholder="${f.placeholder}" name="${f.name}" component=${f.componentType} tag=${f.element.tagName}`
        );
      });

      // Step 5: 匹配字段到简历数据
      Logger.info('Step 5: Matching fields...');
      const matchedFields = this.fieldMatcher.match(detectedFields);
      Logger.info(`Matched ${matchedFields.length} fields to resume data`);

      // 调试：打印所有匹配结果
      matchedFields.forEach((m, i) => {
        Logger.info(
          `  [${i}] field="${m.detectedField.label}" → resume="${m.resumeFieldKey}" confidence=${m.confidence.toFixed(2)} strategy=${m.fillStrategy}`
        );
      });

      // Step 6: 应用站点自定义映射
      const finalMappings = siteConfig.applyFieldMappings?.(matchedFields) ?? matchedFields;

      // Step 7: 逐字段填充
      Logger.info('Step 7: Filling fields...');
      const report = await this.fillFields(finalMappings, resumeData, adapter, options);

      // Step 8: 后处理
      Logger.info('Step 8: Post-fill processing...');
      await adapter.afterFill?.({
        resumeData,
        config: this.config,
        platform: this.platform,
      });
      await siteConfig.afterFill?.();

      report.totalDuration = Date.now() - startTime;
      report.site = {
        name: siteConfig.name,
        url: window.location.href,
        framework: siteConfig.framework,
        uiLibrary: siteConfig.uiLibrary,
      };

      options.onComplete?.(report);
      Logger.info(`Fill complete: ${report.filledCount} filled, ${report.failedCount} failed, ${report.skippedCount} skipped`);
      return report;

    } catch (error) {
      Logger.error('Fill failed:', error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /** 逐字段填充 */
  private async fillFields(
    mappings: MatchedField[],
    resumeData: ResumeData,
    adapter: BaseAdapterLike,
    options: FillOptions
  ): Promise<FillReport> {
    const report: FillReport = {
      totalFields: mappings.length,
      filledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      totalDuration: 0,
      details: [],
      site: { name: '', url: '', framework: '', uiLibrary: '' },
    };

    for (let i = 0; i < mappings.length; i++) {
      if (this.aborted) break;

      const mapping = mappings[i];
      const value = this.getResumeValue(resumeData, mapping.resumeFieldKey);

      // 跳过空值
      if (value === undefined || value === null || value === '') {
        report.skippedCount++;
        options.onProgress?.({
          current: i + 1,
          total: mappings.length,
          currentField: mapping.detectedField.label,
          status: 'pending',
        });
        continue;
      }

      // 跳过已有值的字段
      if (this.config.skipFilled && adapter.hasValue(mapping.detectedField.element)) {
        report.skippedCount++;
        options.onProgress?.({
          current: i + 1,
          total: mappings.length,
          currentField: mapping.detectedField.label,
          status: 'pending',
        });
        continue;
      }

      // 进度回调
      options.onProgress?.({
        current: i + 1,
        total: mappings.length,
        currentField: mapping.detectedField.label,
        status: 'filling',
      });

      // 重试逻辑
      let result = null;
      for (let retry = 0; retry <= this.config.maxRetries; retry++) {
        result = await adapter.fillField({
          field: mapping.detectedField,
          value,
          resumeData,
          config: this.config,
          platform: this.platform,
          signal: options.signal,
        });

        if (result.success) break;
        if (retry < this.config.maxRetries) {
          Logger.warn(`Retrying "${mapping.detectedField.label}" (${retry + 1}/${this.config.maxRetries})`);
          await this.sleep(this.config.actionDelay * 2);
        }
      }

      report.details.push({
        fieldLabel: mapping.detectedField.label,
        fieldKey: mapping.resumeFieldKey,
        success: result?.success ?? false,
        strategy: result?.strategy ?? FillStrategy.NATIVE_SETTER,
        error: result?.error,
      });

      if (result?.success) {
        report.filledCount++;
        options.onProgress?.({
          current: i + 1,
          total: mappings.length,
          currentField: mapping.detectedField.label,
          status: 'success',
        });
      } else {
        report.failedCount++;
        options.onProgress?.({
          current: i + 1,
          total: mappings.length,
          currentField: mapping.detectedField.label,
          status: 'error',
        });
      }
    }

    return report;
  }

  /** 从简历数据中按路径获取值 */
  private getResumeValue(data: ResumeData, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  /** 中止填充 */
  abort(): void {
    this.aborted = true;
    this.actionQueue.abort();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
