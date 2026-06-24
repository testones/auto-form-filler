// ===== packages/core/src/field/DOMScanner.ts =====
/**
 * DOM 树扫描器
 *
 * 负责扫描 DOM 树，发现所有表单控件元素。
 * 分为两类扫描：
 * 1. 原生表单元素：input, textarea, select
 * 2. 框架组件：通过 CSS 选择器识别 Ant Design / Element UI 等封装的组件
 */

import type { DetectedField } from '@auto-form-filler/shared/types';
import { FieldType } from '@auto-form-filler/shared/types';
import {
  ANT_DESIGN_SELECTORS,
  ELEMENT_UI_SELECTORS,
  NATIVE_SELECTORS,
} from '@auto-form-filler/shared/constants';
import { getLabelForElement, isElementVisible, isElementDisabled } from '../utils/dom.js';
import { FieldClassifier } from './FieldClassifier.js';

export class DOMScanner {
  private root: HTMLElement | Document;

  constructor(root: HTMLElement | Document = document) {
    this.root = root;
  }

  /** 扫描原生表单元素 */
  scanNativeFormElements(): DetectedField[] {
    const fields: DetectedField[] = [];

    // 扫描所有 input（排除隐藏、提交、按钮等类型）
    const inputs = this.root.querySelectorAll<HTMLInputElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])'
    );
    for (const input of inputs) {
      if (!isElementVisible(input) || isElementDisabled(input)) continue;
      const field = this.createDetectedField(input);
      if (field) fields.push(field);
    }

    // 扫描 textarea
    const textareas = this.root.querySelectorAll<HTMLTextAreaElement>('textarea');
    for (const ta of textareas) {
      if (!isElementVisible(ta) || isElementDisabled(ta)) continue;
      const field = this.createDetectedField(ta);
      if (field) fields.push(field);
    }

    // 扫描 select
    const selects = this.root.querySelectorAll<HTMLSelectElement>('select');
    for (const sel of selects) {
      if (!isElementVisible(sel) || isElementDisabled(sel)) continue;
      const field = this.createDetectedField(sel);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 扫描框架组件 */
  scanFrameworkComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    // Ant Design 组件
    fields.push(...this.scanAntDesignComponents());

    // Element UI 组件
    fields.push(...this.scanElementUIComponents());

    // 其他通用组件检测
    fields.push(...this.scanGenericComponents());

    return fields;
  }

  /** 扫描 Ant Design 组件 */
  private scanAntDesignComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    // Form Item 容器
    const formItems = this.root.querySelectorAll('.ant-form-item');
    for (const item of formItems) {
      if (!isElementVisible(item as HTMLElement)) continue;
      const field = this.processFormItemContainer(item as HTMLElement);
      if (field) fields.push(field);
    }

    // 独立的 Select（不在 form-item 中）
    const standaloneSelects = this.root.querySelectorAll('.ant-select:not(.ant-form-item .ant-select)');
    for (const sel of standaloneSelects) {
      if (!isElementVisible(sel as HTMLElement) || isElementDisabled(sel as HTMLElement)) continue;
      const field = this.createDetectedField(sel as HTMLElement);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 扫描 Element UI 组件 */
  private scanElementUIComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    const formItems = this.root.querySelectorAll('.el-form-item');
    for (const item of formItems) {
      if (!isElementVisible(item as HTMLElement)) continue;
      const field = this.processFormItemContainer(item as HTMLElement);
      if (field) fields.push(field);
    }

    const standaloneSelects = this.root.querySelectorAll('.el-select:not(.el-form-item .el-select)');
    for (const sel of standaloneSelects) {
      if (!isElementVisible(sel as HTMLElement) || isElementDisabled(sel as HTMLElement)) continue;
      const field = this.createDetectedField(sel as HTMLElement);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 扫描通用组件（role 属性等） */
  private scanGenericComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    // 带 role 属性的组合框
    const comboboxes = this.root.querySelectorAll('[role="combobox"], [role="listbox"]');
    for (const cb of comboboxes) {
      if (!isElementVisible(cb as HTMLElement) || isElementDisabled(cb as HTMLElement)) continue;
      const field = this.createDetectedField(cb as HTMLElement);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 处理表单项容器（.ant-form-item / .el-form-item） */
  private processFormItemContainer(container: HTMLElement): DetectedField | null {
    // 在容器内找到实际的表单控件
    const controlSelectors = [
      'input:not([type="hidden"])',
      'textarea',
      'select',
      '.ant-select',
      '.ant-picker',
      '.ant-cascader',
      '.ant-checkbox-group',
      '.ant-radio-group',
      '.ant-input-number',
      '.ant-switch',
      '.ant-upload',
      '.el-select',
      '.el-date-editor',
      '.el-cascader',
      '.el-checkbox-group',
      '.el-radio-group',
      '.el-input-number',
      '.el-switch',
      '.el-upload',
      '[role="combobox"]',
      '[role="radiogroup"]',
    ];

    for (const sel of controlSelectors) {
      const control = container.querySelector(sel);
      if (control && isElementVisible(control as HTMLElement) && !isElementDisabled(control as HTMLElement)) {
        const field = this.createDetectedField(control as HTMLElement, container);
        if (field) return field;
      }
    }

    return null;
  }

  /** 创建 DetectedField */
  private createDetectedField(element: HTMLElement, container?: HTMLElement): DetectedField | null {
    const label = getLabelForElement(element) || '';
    const placeholder =
      element.getAttribute('placeholder') ||
      element.querySelector('input')?.getAttribute('placeholder') ||
      '';

    // 如果没有 label 且没有 placeholder，跳过（可能是装饰性控件）
    if (!label && !placeholder) {
      // 但仍然检查 name 属性
      const name = element.getAttribute('name') || element.querySelector('input')?.getAttribute('name');
      if (!name) return null;
    }

    const fieldType = FieldClassifier.classify(element);

    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }

    // 收集内部 input 的属性
    const innerInput = element.querySelector('input');
    if (innerInput) {
      for (const attr of innerInput.attributes) {
        if (!attributes[attr.name]) {
          attributes[attr.name] = attr.value;
        }
      }
    }

    return {
      element,
      fieldType,
      label,
      placeholder,
      name: attributes['name'] || '',
      required:
        element.hasAttribute('required') ||
        element.getAttribute('aria-required') === 'true' ||
        !!container?.querySelector('.ant-form-item-required, .el-form-item.is-required, [class*="required"]'),
      componentType: FieldClassifier.getComponentType(element),
      confidence: FieldClassifier.getConfidence(element, label),
      container,
      attributes,
    };
  }
}
