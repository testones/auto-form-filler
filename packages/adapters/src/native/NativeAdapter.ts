// ===== packages/adapters/src/native/NativeAdapter.ts =====
/**
 * 原生 HTML 表单适配器
 *
 * 处理无框架的原生 HTML 表单元素。
 * 这是最基础的适配器，也是其他适配器的兜底方案。
 */

import { EventSimulator } from '@auto-form-filler/core';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { AdapterCapability, FillContext, FillResult } from '../base/types.js';

export class NativeAdapter extends BaseAdapter {
  readonly capability: AdapterCapability = {
    name: 'native',
    framework: 'native',
    uiLibrary: 'native',
    versionRange: '*',
    supportedFieldTypes: [
      'text', 'textarea', 'number', 'email', 'phone', 'url', 'password',
      'select', 'multi_select',
      'checkbox', 'checkbox_group',
      'radio', 'radio_group',
      'file_upload',
    ],
  };

  detect(_document: Document): boolean {
    // 原生适配器始终可用，作为兜底方案
    return true;
  }

  async fillField(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    this.scrollIntoView(field.element);

    try {
      if (field.element instanceof HTMLInputElement) {
        return await this.fillInputElement(context);
      }

      if (field.element instanceof HTMLTextAreaElement) {
        return await this.fillTextareaElement(context);
      }

      if (field.element instanceof HTMLSelectElement) {
        return await this.fillSelectElement(context);
      }

      // 非原生元素，尝试用通用方式
      return await this.fillGeneric(context);
    } catch (error) {
      return this.errorResult(field.label, Date.now() - startTime, (error as Error).message, FillStrategy.DOM_EVENT);
    }
  }

  getFieldValue(element: HTMLElement): unknown {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked;
      }
      return element.value;
    }
    if (element instanceof HTMLTextAreaElement) return element.value;
    if (element instanceof HTMLSelectElement) return element.value;

    const input = element.querySelector('input, textarea, select');
    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox' || input.type === 'radio') return input.checked;
      return input.value;
    }
    if (input instanceof HTMLTextAreaElement) return input.value;
    if (input instanceof HTMLSelectElement) return input.value;

    return null;
  }

  private async fillInputElement(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const input = field.element as HTMLInputElement;

    switch (input.type) {
      case 'checkbox':
      case 'radio': {
        const shouldCheck = typeof value === 'boolean' ? value : String(value) === String(input.value);
        const result = await EventSimulator.simulateCheckable(input, shouldCheck, { delay: config.actionDelay });
        return {
          success: result.success,
          fieldKey: field.label,
          duration: Date.now() - startTime,
          strategy: FillStrategy.DOM_EVENT,
          error: result.error?.message,
        };
      }

      case 'file': {
        if (value instanceof File) {
          const result = EventSimulator.simulateFileUpload(input, [value]);
          return {
            success: result.success,
            fieldKey: field.label,
            duration: Date.now() - startTime,
            strategy: FillStrategy.DOM_EVENT,
            error: result.error?.message,
          };
        }
        return this.errorResult(field.label, Date.now() - startTime, 'No File object provided', FillStrategy.DOM_EVENT);
      }

      default: {
        const result = await EventSimulator.simulateTextInput(input, String(value ?? ''), {
          useNativeSetter: true,
          delay: config.actionDelay,
        });
        if (config.highlightFilled) this.highlight(input, config.highlightColor);
        return {
          success: result.success,
          fieldKey: field.label,
          duration: Date.now() - startTime,
          strategy: FillStrategy.NATIVE_SETTER,
          error: result.error?.message,
        };
      }
    }
  }

  private async fillTextareaElement(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const result = await EventSimulator.simulateTextInput(field.element, String(value ?? ''), {
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

  private async fillSelectElement(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const select = field.element as HTMLSelectElement;

    const strValue = String(value ?? '');
    const option = Array.from(select.options).find((opt) => opt.value === strValue || opt.text === strValue);

    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      if (config.highlightFilled) this.highlight(select, config.highlightColor);
      return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
    }

    return this.errorResult(field.label, Date.now() - startTime, `Option "${strValue}" not found`, FillStrategy.DOM_EVENT);
  }

  private async fillGeneric(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // 尝试找到内部的 input/select/textarea
    const innerInput = field.element.querySelector('input, textarea, select');
    if (innerInput) {
      if (innerInput instanceof HTMLInputElement) {
        return await this.fillInputElement({ ...context, field: { ...field, element: innerInput } });
      }
      if (innerInput instanceof HTMLTextAreaElement) {
        return await this.fillTextareaElement({ ...context, field: { ...field, element: innerInput } });
      }
      if (innerInput instanceof HTMLSelectElement) {
        return await this.fillSelectElement({ ...context, field: { ...field, element: innerInput } });
      }
    }

    // 最后尝试：直接设置 textContent（contenteditable 等）
    if (field.element.isContentEditable) {
      field.element.textContent = String(value ?? '');
      field.element.dispatchEvent(new Event('input', { bubbles: true }));
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
    }

    return this.errorResult(field.label, Date.now() - startTime, 'Cannot determine fill method', FillStrategy.DOM_EVENT);
  }
}
