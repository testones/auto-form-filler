// ===== packages/adapters/src/react/ReactAdapter.ts =====
/**
 * React 通用适配器
 *
 * 用于处理非特定 UI 库的 React 受控组件。
 * 适用于 BOSS直聘、拉勾网等自研组件体系。
 */

import { EventSimulator } from '@auto-form-filler/core';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { AdapterCapability, FillContext, FillResult } from '../base/types.js';

export class ReactAdapter extends BaseAdapter {
  readonly capability: AdapterCapability = {
    name: 'react-generic',
    framework: 'react',
    uiLibrary: 'custom',
    versionRange: '16.x || 17.x || 18.x',
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
    // 检测 React 特征
    const rootEl = document.getElementById('root') || document.getElementById('app');
    if (rootEl) {
      const reactKey = Object.keys(rootEl).find((k) =>
        k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
      );
      if (reactKey) return true;
    }

    // 检查全局 React 变量
    return !!(window as unknown as Record<string, unknown>).React;
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

    // 对于原生 select 元素
    if (field.element instanceof HTMLSelectElement) {
      field.element.value = String(value ?? '');
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      field.element.dispatchEvent(new Event('input', { bubbles: true }));
      return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
    }

    // 对于自定义 select 组件
    const trigger = field.element.querySelector('[role="combobox"], [role="listbox"], input') || field.element;
    await EventSimulator.simulateSelect(trigger as HTMLElement, String(value ?? ''), {
      delay: config.actionDelay,
      optionMatchFn: (el, val) => el.textContent?.trim() === val,
    });

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  private async fillDatePicker(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const input = field.element.querySelector('input') || field.element;
    if (input instanceof HTMLInputElement) {
      await EventSimulator.simulateTextInput(input, String(value ?? ''), {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  private async fillCheckable(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // 查找组内匹配的选项
    const targetValue = String(value ?? '');
    const wrappers = field.element.querySelectorAll('label, [role="radio"], [role="checkbox"]');

    for (const wrapper of wrappers) {
      const label = wrapper.textContent?.trim() || '';
      if (label.includes(targetValue) || targetValue.includes(label)) {
        await EventSimulator.simulateCheckable(wrapper as HTMLElement, true, {
          delay: config.actionDelay,
        });
        break;
      }
    }

    // 兜底：直接点击元素
    if (wrappers.length === 0) {
      await EventSimulator.simulateCheckable(field.element, true, {
        delay: config.actionDelay,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
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
