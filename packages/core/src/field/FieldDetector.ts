// ===== packages/core/src/field/FieldDetector.ts =====
/**
 * 表单字段检测器
 *
 * 整合 DOMScanner + LabelParser + FieldClassifier，
 * 提供统一的字段检测接口
 */

import type { DetectedField } from '@auto-form-filler/shared/types';
import { DOMScanner } from './DOMScanner.js';

export class FieldDetector {
  private scanner: DOMScanner;

  constructor() {
    this.scanner = new DOMScanner();
  }

  /**
   * 扫描整个文档，检测所有表单字段
   */
  detectAll(root: HTMLElement | Document = document): DetectedField[] {
    const scanner = new DOMScanner(root);
    const fields: DetectedField[] = [];

    // 1. 扫描原生表单元素
    const nativeFields = scanner.scanNativeFormElements();
    fields.push(...nativeFields);

    // 2. 扫描框架组件
    const frameworkFields = scanner.scanFrameworkComponents();
    fields.push(...frameworkFields);

    // 去重：同一个 DOM 元素可能被多次检测
    return this.deduplicate(fields);
  }

  /**
   * 在指定容器内检测字段
   */
  detectInContainer(container: HTMLElement): DetectedField[] {
    return this.detectAll(container);
  }

  /**
   * 按字段类型筛选
   */
  filterByType(fields: DetectedField[], type: string): DetectedField[] {
    return fields.filter((f) => f.fieldType === type);
  }

  /**
   * 按标签文本查找
   */
  findByLabel(fields: DetectedField[], labelPattern: string): DetectedField[] {
    const normalized = labelPattern.toLowerCase();
    return fields.filter((f) =>
      f.label.toLowerCase().includes(normalized)
    );
  }

  /** 去重 */
  private deduplicate(fields: DetectedField[]): DetectedField[] {
    const seen = new Set<HTMLElement>();
    return fields.filter((f) => {
      if (seen.has(f.element)) return false;
      seen.add(f.element);
      return true;
    });
  }
}
