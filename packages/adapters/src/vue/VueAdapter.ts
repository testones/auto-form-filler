// ===== packages/adapters/src/vue/VueAdapter.ts =====
/**
 * Vue 通用适配器
 *
 * 用于处理非特定 UI 库的 Vue 组件。
 * 支持 iView UI、智联自研组件（zp-radio, select-input）等
 */

import { EventSimulator } from '@auto-form-filler/core';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { AdapterCapability, FillContext, FillResult } from '../base/types.js';

export class VueAdapter extends BaseAdapter {
  readonly capability: AdapterCapability = {
    name: 'vue-generic',
    framework: 'vue',
    uiLibrary: 'custom',
    versionRange: '2.x || 3.x',
    supportedFieldTypes: [
      'text', 'textarea', 'number', 'email', 'phone',
      'select', 'multi_select',
      'date_picker', 'date_range',
      'checkbox', 'checkbox_group',
      'radio', 'radio_group',
      'file_upload',
    ],
  };

  detect(document: Document): boolean {
    const app = document.querySelector('#app, [data-v-app]');
    if (app) {
      const vueKey = Object.keys(app).find((k) => k.startsWith('__vue__') || k.startsWith('__vue_app__'));
      if (vueKey) return true;
    }
    return !!(window as unknown as Record<string, unknown>).Vue;
  }

  async fillField(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    this.scrollIntoView(field.element);

    try {
      switch (field.fieldType) {
        case 'text':
        case 'textarea':
        case 'number':
        case 'email':
        case 'phone':
          return await this.fillInput(context);

        case 'select':
        case 'multi_select':
          return await this.fillSelect(context);

        case 'date_picker':
        case 'date_range':
          return await this.fillDatePicker(context);

        case 'checkbox':
        case 'checkbox_group':
        case 'radio':
        case 'radio_group':
          return await this.fillCheckable(context);

        case 'file_upload':
          return await this.fillUpload(context);

        default:
          return this.errorResult(field.label, Date.now() - startTime, `Unsupported: ${field.fieldType}`, FillStrategy.NATIVE_SETTER);
      }
    } catch (error) {
      return this.errorResult(field.label, Date.now() - startTime, (error as Error).message, FillStrategy.NATIVE_SETTER);
    }
  }

  getFieldValue(element: HTMLElement): unknown {
    const input = element.querySelector('input, textarea');
    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') return input.checked;
      return input.value;
    }
    if (input instanceof HTMLTextAreaElement) return input.value;
    return (element as HTMLInputElement).value || '';
  }

  private async fillInput(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const input = field.element.querySelector('input, textarea') || field.element;
    const result = await EventSimulator.simulateTextInput(input as HTMLElement, String(value ?? ''), {
      useNativeSetter: true,
      delay: config.actionDelay,
    });

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return {
      success: result.success,
      fieldKey: field.label,
      duration: Date.now() - startTime,
      strategy: FillStrategy.NATIVE_SETTER,
      error: result.error?.message,
    };
  }

  private async fillSelect(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    // 原生 select
    if (field.element instanceof HTMLSelectElement) {
      field.element.value = targetValue;
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
    }

    // iView Select (ivu-select)
    if (field.componentType === 'ivu-select' || field.element.closest('.ivu-select')) {
      return await this.fillIvuSelect(context);
    }

    // 智联 select-input
    if (field.componentType === 'select-input' || field.element.closest('.select-input')) {
      return await this.fillSelectInput(context);
    }

    // 通用框架 Select（click 打开 → 查找选项 → click 选中）
    const trigger = field.element.querySelector('input, [role="combobox"], .ivu-select-selection, .select-input') || field.element;
    await EventSimulator.simulateSelect(trigger as HTMLElement, targetValue, {
      delay: config.actionDelay,
      optionMatchFn: (el, val) => el.textContent?.trim() === val || el.textContent?.includes(val),
    });

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** iView Select 填充 */
  private async fillIvuSelect(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    const selectEl = field.element.closest('.ivu-select') || field.element;
    const trigger = selectEl.querySelector('.ivu-select-selection') || selectEl;

    // Step 1: 点击打开下拉
    this.scrollIntoView(selectEl as HTMLElement);
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await this.sleep(config.actionDelay * 3);

    // Step 2: 查找选项
    const options = document.querySelectorAll('.ivu-select-dropdown-list .ivu-select-item, .ivu-select-item');
    let found = false;
    for (const opt of options) {
      const text = opt.textContent?.trim() || '';
      // 匹配值或文本
      if (text === targetValue || text.includes(targetValue) ||
          this.matchGenderValue(text, targetValue) || this.matchDegreeValue(text, targetValue)) {
        (opt as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        found = true;
        await this.sleep(config.actionDelay);
        break;
      }
    }

    if (!found) {
      // 关闭下拉
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    if (config.highlightFilled) this.highlight(selectEl as HTMLElement, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** 智联 select-input 填充 */
  private async fillSelectInput(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    const selectEl = field.element.closest('.select-input') || field.element;
    this.scrollIntoView(selectEl as HTMLElement);

    // Step 1: 点击打开
    selectEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await this.sleep(config.actionDelay * 3);

    // Step 2: 查找下拉选项（智联的城市选择器通常在 .s-region 中）
    const regionEl = selectEl.parentElement?.querySelector('.s-region');
    let found = false;

    if (regionEl) {
      // 城市选择器：逐级选择
      const items = regionEl.querySelectorAll('li, .city-item, [class*="region"] li, a');
      for (const item of items) {
        if (item.textContent?.trim() === targetValue || item.textContent?.includes(targetValue)) {
          (item as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          found = true;
          await this.sleep(config.actionDelay);
          break;
        }
      }
    }

    if (!found) {
      // 通用查找
      const allItems = document.querySelectorAll('li, [role="option"], [class*="dropdown"] li');
      for (const item of allItems) {
        if (item.textContent?.trim() === targetValue) {
          (item as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          found = true;
          await this.sleep(config.actionDelay);
          break;
        }
      }
    }

    if (!found) {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    if (config.highlightFilled) this.highlight(selectEl as HTMLElement, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** 性别值匹配 */
  private matchGenderValue(text: string, value: string): boolean {
    const genderMap: Record<string, string[]> = {
      male: ['男'], female: ['女'],
    };
    const targets = genderMap[value.toLowerCase()];
    return !!targets?.some(t => text.includes(t));
  }

  /** 学历值匹配 */
  private matchDegreeValue(text: string, value: string): boolean {
    const degreeMap: Record<string, string[]> = {
      doctor: ['博士'], master: ['硕士'], bachelor: ['本科'],
      associate: ['大专'], highschool: ['高中'],
    };
    const targets = degreeMap[value.toLowerCase()];
    return !!targets?.some(t => text.includes(t));
  }

  private async fillDatePicker(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // iView DatePicker: input 是 readonly，需要直接设置值 + 触发事件
    const input = field.element.querySelector('input') || field.element;
    if (input instanceof HTMLInputElement) {
      // 格式化日期值（智联 DatePicker 通常是 YYYY-MM 或 YYYY-MM-DD）
      const dateValue = this.formatDate(String(value ?? ''));

      input.focus();
      input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      await this.sleep(config.actionDelay);

      // 使用原生 setter 设置值
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(input, dateValue);

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await this.sleep(config.actionDelay);

      input.blur();
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    }

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  /** 格式化日期 */
  private formatDate(value: string): string {
    // 如果是 YYYY-MM 格式，直接返回
    if (/^\d{4}-\d{2}$/.test(value)) return value;
    // 如果是 YYYY-MM-DD 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // 尝试转换其他格式
    return value;
  }

  private async fillCheckable(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    // 智联 zp-radio: 选项是 li.zp-radio__item
    if (field.componentType === 'zp-radio' || field.element.querySelector('.zp-radio')) {
      return await this.fillZpRadio(context);
    }

    // 通用：查找 label 或 li 选项
    const wrappers = field.element.querySelectorAll('label, li, .ivu-radio-wrapper, .ivu-checkbox-wrapper');
    for (const wrapper of wrappers) {
      const text = wrapper.textContent?.trim() || '';
      if (text.includes(targetValue) || this.matchGenderValue(text, targetValue)) {
        (wrapper as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await this.sleep(config.actionDelay);
        if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
        return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
      }
    }

    return this.errorResult(field.label, Date.now() - startTime, `未找到匹配的选项: ${targetValue}`, FillStrategy.DOM_EVENT);
  }

  /** 智联 zp-radio 填充 */
  private async fillZpRadio(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    // zp-radio 的选项是 li.zp-radio__item
    const items = field.element.querySelectorAll('.zp-radio__item, .zp-radio__list li');
    for (const item of items) {
      const text = item.textContent?.trim() || '';
      if (text.includes(targetValue) || this.matchGenderValue(text, targetValue)) {
        this.scrollIntoView(item as HTMLElement);
        (item as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await this.sleep(config.actionDelay);
        if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
        return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
      }
    }

    return this.errorResult(field.label, Date.now() - startTime, `zp-radio 未找到匹配: ${targetValue}`, FillStrategy.DOM_EVENT);
  }

  private async fillUpload(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const fileInput = field.element.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput && value instanceof File) {
      EventSimulator.simulateFileUpload(fileInput, [value]);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }
}
