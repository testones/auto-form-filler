// ===== packages/core/src/field/DOMScanner.ts =====
/**
 * DOM 树扫描器
 *
 * 负责扫描 DOM 树，发现所有表单控件元素。
 */

import type { DetectedField } from '@auto-form-filler/shared/types';
import { FieldType } from '@auto-form-filler/shared/types';
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
      // 放宽可见性检查 — SPA 可能还在动画中
      if (isElementDisabled(input)) continue;
      const field = this.createDetectedField(input);
      if (field) fields.push(field);
    }

    // 扫描 textarea
    const textareas = this.root.querySelectorAll<HTMLTextAreaElement>('textarea');
    for (const ta of textareas) {
      if (isElementDisabled(ta)) continue;
      const field = this.createDetectedField(ta);
      if (field) fields.push(field);
    }

    // 扫描 select
    const selects = this.root.querySelectorAll<HTMLSelectElement>('select');
    for (const sel of selects) {
      if (isElementDisabled(sel)) continue;
      const field = this.createDetectedField(sel);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 扫描框架组件 */
  scanFrameworkComponents(): DetectedField[] {
    const fields: DetectedField[] = [];
    fields.push(...this.scanAntDesignComponents());
    fields.push(...this.scanElementUIComponents());
    fields.push(...this.scanIViewComponents());
    fields.push(...this.scanGenericComponents());
    return fields;
  }

  /** 扫描 Ant Design 组件 */
  private scanAntDesignComponents(): DetectedField[] {
    const fields: DetectedField[] = [];
    const formItems = this.root.querySelectorAll('.ant-form-item');
    for (const item of formItems) {
      const field = this.processFormItemContainer(item as HTMLElement);
      if (field) fields.push(field);
    }
    return fields;
  }

  /** 扫描 Element UI 组件 */
  private scanElementUIComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    // 1. 通过 el-form-item 扫描
    const formItems = this.root.querySelectorAll('.el-form-item');
    for (const item of formItems) {
      const field = this.processFormItemContainer(item as HTMLElement);
      if (field) fields.push(field);
    }

    // 2. 扫描独立的 el-input（不在 el-form-item 中的）
    const standaloneInputs = this.root.querySelectorAll('.el-input');
    for (const el of standaloneInputs) {
      // 如果已经在 el-form-item 中处理过就跳过
      if (el.closest('.el-form-item')) continue;
      const input = el.querySelector('input');
      if (input && !isElementDisabled(input)) {
        const field = this.createDetectedField(el as HTMLElement);
        if (field) fields.push(field);
      }
    }

    // 3. 扫描独立的 el-select
    const standaloneSelects = this.root.querySelectorAll('.el-select');
    for (const el of standaloneSelects) {
      if (el.closest('.el-form-item')) continue;
      const field = this.createDetectedField(el as HTMLElement);
      if (field) fields.push(field);
    }

    // 4. 扫描 el-date-editor
    const datePickers = this.root.querySelectorAll('.el-date-editor');
    for (const el of datePickers) {
      if (el.closest('.el-form-item')) continue;
      const field = this.createDetectedField(el as HTMLElement);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 扫描 iView UI 组件（智联招聘） */
  private scanIViewComponents(): DetectedField[] {
    const fields: DetectedField[] = [];

    // 1. 通过 profileLib__item 扫描（智联特有的表单项容器）
    const profileItems = this.root.querySelectorAll('.profileLib__item, .profile-edit-item, .job-target-edit__item');
    for (const item of profileItems) {
      const field = this.processProfileItemContainer(item as HTMLElement);
      if (field) fields.push(field);
    }

    // 2. 扫描独立的 ivu-input（不在表单项容器中的）
    const ivuInputs = this.root.querySelectorAll('.ivu-input:not(.ivu-input[readonly])');
    for (const el of ivuInputs) {
      if (el.closest('.profileLib__item, .profile-edit-item, .ivu-form-item')) continue;
      const field = this.createDetectedField(el as HTMLElement);
      if (field) fields.push(field);
    }

    // 3. 扫描 ivu-date-picker（包括 readonly 的 input）
    const ivuDatePickers = this.root.querySelectorAll('.ivu-date-picker');
    for (const el of ivuDatePickers) {
      if (el.closest('.profileLib__item, .profile-edit-item')) continue;
      const input = el.querySelector('input');
      if (input) {
        const field = this.createDetectedField(input);
        if (field) fields.push(field);
      }
    }

    // 4. 扫描 ivu-select
    const ivuSelects = this.root.querySelectorAll('.ivu-select');
    for (const el of ivuSelects) {
      if (el.closest('.profileLib__item, .profile-edit-item')) continue;
      const field = this.createDetectedField(el as HTMLElement);
      if (field) fields.push(field);
    }

    return fields;
  }

  /** 处理智联特有的表单项容器 .profileLib__item */
  private processProfileItemContainer(container: HTMLElement): DetectedField | null {
    const controlSelectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'textarea',
      'select',
      '.ivu-input',
      '.ivu-select',
      '.ivu-date-picker',
      '.zp-radio',
      '.select-input',
      '[role="combobox"]',
    ];

    for (const sel of controlSelectors) {
      const control = container.querySelector(sel);
      if (control && !isElementDisabled(control as HTMLElement)) {
        const field = this.createDetectedField(control as HTMLElement, container);
        if (field) return field;
      }
    }

    return null;
  }

  /** 扫描通用组件（role 属性等） */
  private scanGenericComponents(): DetectedField[] {
    const fields: DetectedField[] = [];
    const comboboxes = this.root.querySelectorAll('[role="combobox"], [role="listbox"]');
    for (const cb of comboboxes) {
      if (isElementDisabled(cb as HTMLElement)) continue;
      const field = this.createDetectedField(cb as HTMLElement);
      if (field) fields.push(field);
    }
    return fields;
  }

  /** 处理表单项容器 */
  private processFormItemContainer(container: HTMLElement): DetectedField | null {
    const controlSelectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
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
      '.el-input',
      '[role="combobox"]',
      '[role="radiogroup"]',
    ];

    for (const sel of controlSelectors) {
      const control = container.querySelector(sel);
      if (control && !isElementDisabled(control as HTMLElement)) {
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

    // 获取 name 属性
    const name =
      element.getAttribute('name') ||
      element.querySelector('input')?.getAttribute('name') ||
      '';

    // 不再跳过没有 label/placeholder/name 的元素
    // 智联等网站的 label 可能在远处的容器中，后续 FieldMatcher 会通过语义匹配

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
      name,
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
