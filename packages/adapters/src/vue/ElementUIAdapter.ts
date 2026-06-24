// ===== packages/adapters/src/vue/ElementUIAdapter.ts =====
/**
 * Element UI / Element Plus 适配器
 *
 * 处理 Element UI (Vue 2) 和 Element Plus (Vue 3) 的表单组件。
 *
 * 关键特性：
 * - v-model 绑定：本质监听 input/change 事件
 * - el-select：click 打开下拉 → 查找 .el-select-dropdown__item → click
 * - el-date-picker：支持直接输入
 * - el-cascader：逐级展开
 */

import { EventSimulator } from '@auto-form-filler/core';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { AdapterCapability, FillContext, FillResult } from '../base/types.js';

export class ElementUIAdapter extends BaseAdapter {
  readonly capability: AdapterCapability = {
    name: 'element-ui',
    framework: 'vue',
    uiLibrary: 'element-ui',
    versionRange: '2.x (Element UI) || 2.x (Element Plus)',
    supportedFieldTypes: [
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      'select', 'multi_select',
      'date_picker', 'date_range', 'time_picker',
      'cascader', 'checkbox', 'checkbox_group',
      'radio', 'radio_group', 'switch',
      'file_upload', 'image_upload',
      'slider',
    ],
  };

  detect(document: Document): boolean {
    return !!(
      document.querySelector('.el-form') ||
      document.querySelector('.el-input') ||
      document.querySelector('.el-select') ||
      document.querySelector('.el-button') ||
      document.querySelector('[class*="el-plus"]')
    );
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
        case 'url':
        case 'password':
          return await this.fillInput(context);

        case 'select':
          return await this.fillSelect(context);

        case 'multi_select':
          return await this.fillMultiSelect(context);

        case 'date_picker':
          return await this.fillDatePicker(context);

        case 'date_range':
          return await this.fillDateRange(context);

        case 'cascader':
          return await this.fillCascader(context);

        case 'checkbox':
        case 'checkbox_group':
        case 'radio':
        case 'radio_group':
          return await this.fillCheckable(context);

        case 'switch':
          return await this.fillSwitch(context);

        case 'file_upload':
        case 'image_upload':
          return await this.fillUpload(context);

        default:
          return this.errorResult(field.label, Date.now() - startTime, `Unsupported: ${field.fieldType}`, FillStrategy.DOM_EVENT);
      }
    } catch (error) {
      return this.errorResult(field.label, Date.now() - startTime, (error as Error).message, FillStrategy.DOM_EVENT);
    }
  }

  getFieldValue(element: HTMLElement): unknown {
    const input = element.querySelector('.el-input__inner, input');
    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') return input.checked;
      return input.value;
    }
    const textarea = element.querySelector('.el-textarea__inner, textarea');
    if (textarea) return (textarea as HTMLTextAreaElement).value;
    return (element as HTMLInputElement).value || '';
  }

  // ============ 输入框 ============

  private async fillInput(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // Element UI: .el-input__inner 或 .el-textarea__inner
    const input = field.element.querySelector(
      '.el-input__inner, .el-textarea__inner, input, textarea'
    ) || field.element;

    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      return this.errorResult(field.label, Date.now() - startTime, 'Input not found', FillStrategy.NATIVE_SETTER);
    }

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

  // ============ 下拉选择 ============

  private async fillSelect(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // Element UI Select:
    // 结构: .el-select > .el-input > .el-input__inner (触发器)
    // 下拉: body > .el-select-dropdown > .el-select-dropdown__list > .el-select-dropdown__item
    const trigger = field.element.querySelector('.el-select') || field.element;
    const triggerInput = trigger.querySelector('.el-input__inner') || trigger;

    const result = await EventSimulator.simulateSelect(
      triggerInput as HTMLElement,
      String(value ?? ''),
      {
        delay: config.actionDelay,
        triggerEvent: 'click',
        optionSelector: '.el-select-dropdown__item',
        optionMatchFn: (el, val) => {
          return el.textContent?.trim() === val;
        },
      }
    );

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return {
      success: result.success,
      fieldKey: field.label,
      duration: Date.now() - startTime,
      strategy: FillStrategy.CLICK_SELECT,
      error: result.error?.message,
    };
  }

  // ============ 多选 ============

  private async fillMultiSelect(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const values = Array.isArray(value) ? value : [value];
    const trigger = field.element.querySelector('.el-select') || field.element;
    const triggerInput = trigger.querySelector('.el-input__inner') || trigger;

    for (const val of values) {
      await EventSimulator.simulateSelect(triggerInput as HTMLElement, String(val), {
        delay: config.actionDelay,
        triggerEvent: 'click',
        optionSelector: '.el-select-dropdown__item',
        optionMatchFn: (el, v) => el.textContent?.trim() === v,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  // ============ 日期选择器 ============

  private async fillDatePicker(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const input = field.element.querySelector('.el-input__inner, input') || field.element;
    if (input instanceof HTMLInputElement) {
      await EventSimulator.simulateTextInput(input, String(value ?? ''), {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  private async fillDateRange(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const rangeValue = value as { start: string; end: string } | [string, string] | string;
    let startDate = '';
    let endDate = '';

    if (Array.isArray(rangeValue)) {
      [startDate, endDate] = rangeValue;
    } else if (typeof rangeValue === 'object' && 'start' in rangeValue) {
      startDate = rangeValue.start;
      endDate = rangeValue.end;
    } else {
      const parts = String(rangeValue).split(/[~～\-—]/);
      startDate = parts[0]?.trim() || '';
      endDate = parts[1]?.trim() || '';
    }

    const inputs = field.element.querySelectorAll('.el-input__inner, input');
    if (inputs.length >= 2) {
      if (inputs[0] instanceof HTMLInputElement) {
        await EventSimulator.simulateTextInput(inputs[0], startDate, { useNativeSetter: true, delay: config.actionDelay });
      }
      if (inputs[1] instanceof HTMLInputElement) {
        await EventSimulator.simulateTextInput(inputs[1], endDate, { useNativeSetter: true, delay: config.actionDelay });
      }
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  // ============ 级联选择 ============

  private async fillCascader(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    let path: string[];
    if (Array.isArray(value)) {
      path = value.map(String);
    } else {
      path = String(value).split(/[/,，]/).map((s) => s.trim());
    }

    const trigger = field.element.querySelector('.el-cascader') || field.element;
    const triggerInput = trigger.querySelector('.el-input__inner') || trigger;

    await EventSimulator.simulateCascader(triggerInput as HTMLElement, path, {
      delay: config.actionDelay,
    });

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  // ============ 复选框/单选框 ============

  private async fillCheckable(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const targetValue = String(value ?? '');

    if (field.fieldType === 'checkbox_group' || field.fieldType === 'radio_group') {
      const items = field.element.querySelectorAll('.el-checkbox, .el-radio, .el-checkbox-button, .el-radio-button');
      for (const item of items) {
        const label = item.textContent?.trim() || '';
        const shouldSelect = Array.isArray(value)
          ? value.some((v: unknown) => label.includes(String(v)))
          : label.includes(targetValue);

        if (shouldSelect) {
          const labelEl = item.querySelector('.el-checkbox__label, .el-radio__label') || item;
          await EventSimulator.simulateCheckable(labelEl as HTMLElement, true, {
            delay: config.actionDelay,
          });
        }
      }
    } else {
      await EventSimulator.simulateCheckable(field.element, true, {
        delay: config.actionDelay,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }

  // ============ Switch ============

  private async fillSwitch(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    await EventSimulator.simulateSwitch(field.element, Boolean(value), {
      delay: config.actionDelay,
    });

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }

  // ============ 文件上传 ============

  private async fillUpload(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const fileInput = field.element.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput && value instanceof File) {
      EventSimulator.simulateFileUpload(fileInput, [value]);
    } else if (fileInput && typeof value === 'string' && value) {
      try {
        const response = await fetch(value);
        const blob = await response.blob();
        const fileName = value.split('/').pop() || 'file';
        const file = new File([blob], fileName, { type: blob.type });
        EventSimulator.simulateFileUpload(fileInput, [file]);
      } catch {
        return this.errorResult(field.label, Date.now() - startTime, 'Download failed', FillStrategy.DOM_EVENT);
      }
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }
}
