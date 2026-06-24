// ===== packages/adapters/src/react/AntDesignAdapter.ts =====
/**
 * Ant Design 适配器
 *
 * 处理 Ant Design 4.x / 5.x 表单组件的填充。
 *
 * 关键特性：
 * - Input: 内部使用原生 input，但被 React 受控组件管理
 * - Select: 虚拟下拉框，需要 click 打开 → 查找选项 → click 选中
 * - DatePicker: 支持直接输入或日历面板选择
 * - Cascader: 逐级展开选择
 * - Upload: 通过 DataTransfer 模拟
 */

import { EventSimulator, NativeSetter } from '@auto-form-filler/core';
import type { FillConfig, PlatformAPI } from '@auto-form-filler/shared/types';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { AdapterCapability, FillContext, FillResult } from '../base/types.js';

export class AntDesignAdapter extends BaseAdapter {
  readonly capability: AdapterCapability = {
    name: 'ant-design',
    framework: 'react',
    uiLibrary: 'antd',
    versionRange: '4.x || 5.x',
    supportedFieldTypes: [
      'text', 'textarea', 'number', 'email', 'phone', 'url',
      'select', 'multi_select', 'tree_select',
      'date_picker', 'date_range', 'time_picker',
      'cascader', 'checkbox', 'checkbox_group',
      'radio', 'radio_group', 'switch',
      'file_upload', 'image_upload',
    ],
  };

  detect(document: Document): boolean {
    return !!(
      document.querySelector('.ant-form') ||
      document.querySelector('.ant-input') ||
      document.querySelector('.ant-select') ||
      document.querySelector('.ant-btn') ||
      (window as unknown as Record<string, unknown>).antd
    );
  }

  async fillField(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // 滚动到可见区域
    this.scrollIntoView(field.element);

    try {
      switch (field.fieldType) {
        case 'text':
        case 'textarea':
        case 'number':
        case 'email':
        case 'phone':
        case 'url':
          return await this.fillInput(context);

        case 'select':
          return await this.fillSelect(context);

        case 'multi_select':
          return await this.fillMultiSelect(context);

        case 'tree_select':
          return await this.fillTreeSelect(context);

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
    // 查找内部 input
    const input = element.querySelector('input');
    if (input) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        return input.checked;
      }
      return input.value;
    }

    // textarea
    const textarea = element.querySelector('textarea');
    if (textarea) return textarea.value;

    // Select - 从显示的文本获取
    const selectItem = element.querySelector('.ant-select-selection-item');
    if (selectItem) return selectItem.textContent?.trim() || '';

    // Switch
    if (element.classList.contains('ant-switch')) {
      return element.classList.contains('ant-switch-checked');
    }

    return (element as HTMLInputElement).value || '';
  }

  // ============ 输入框 ============

  private async fillInput(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // Ant Design Input 组件内部渲染原生 input/textarea
    const input = field.element.querySelector('input, textarea') || field.element;

    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      return this.errorResult(field.label, Date.now() - startTime, 'Input element not found', FillStrategy.NATIVE_SETTER);
    }

    const result = await EventSimulator.simulateTextInput(
      input as HTMLElement,
      String(value ?? ''),
      {
        useNativeSetter: true,
        delay: config.actionDelay,
        focus: true,
        blur: true,
      }
    );

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

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

    // Ant Design Select:
    // 结构: .ant-select > .ant-select-selector (触发器)
    // 下拉: .ant-select-dropdown > .ant-select-item-option (选项)
    const trigger = field.element.querySelector('.ant-select-selector') || field.element;

    const result = await EventSimulator.simulateSelect(
      trigger as HTMLElement,
      String(value ?? ''),
      {
        delay: config.actionDelay,
        triggerEvent: 'mousedown',
        optionSelector: '.ant-select-item-option',
        optionMatchFn: (el, val) => {
          // Ant Design 5.x: 选项标题在 title 属性
          const title = el.getAttribute('title');
          if (title === val) return true;
          // 或者文本内容匹配
          const content = el.querySelector('.ant-select-item-option-content');
          return content?.textContent?.trim() === val || el.textContent?.trim() === val;
        },
      }
    );

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

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
    const trigger = field.element.querySelector('.ant-select-selector') || field.element;

    // 逐个选择
    for (const val of values) {
      const result = await EventSimulator.simulateSelect(
        trigger as HTMLElement,
        String(val),
        {
          delay: config.actionDelay,
          triggerEvent: 'mousedown',
          optionSelector: '.ant-select-item-option',
          optionMatchFn: (el, v) => {
            const title = el.getAttribute('title');
            if (title === v) return true;
            const content = el.querySelector('.ant-select-item-option-content');
            return content?.textContent?.trim() === v || el.textContent?.trim() === v;
          },
        }
      );

      if (!result.success) {
        return this.errorResult(field.label, Date.now() - startTime, `Multi-select: "${val}" failed`, FillStrategy.CLICK_SELECT);
      }
    }

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  // ============ TreeSelect ============

  private async fillTreeSelect(context: FillContext): Promise<FillResult> {
    // TreeSelect 类似于 Select + Cascader 的混合
    // 先尝试直接输入搜索，再考虑树形展开
    const { field, value, config } = context;
    const startTime = Date.now();

    const trigger = field.element.querySelector('.ant-select-selector') || field.element;

    // 策略1: 尝试在搜索框中输入值
    const searchInput = field.element.querySelector('.ant-select-selection-search-input') as HTMLInputElement;
    if (searchInput) {
      await EventSimulator.simulateTextInput(searchInput, String(value ?? ''), {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
      await this.sleep(config.actionDelay * 2);

      // 点击第一个匹配选项
      const firstOption = document.querySelector('.ant-select-tree-treenode[title]');
      if (firstOption) {
        (firstOption as HTMLElement).click();
      }
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  // ============ 日期选择器 ============

  private async fillDatePicker(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const dateStr = String(value ?? '');

    // Ant Design DatePicker:
    // 结构: .ant-picker > input (显示日期)
    // 支持直接输入或日历选择

    const picker = field.element.querySelector('.ant-picker') || field.element;
    const input = picker.querySelector('input');

    if (input instanceof HTMLInputElement) {
      // 策略1: 直接输入日期
      await EventSimulator.simulateTextInput(input, dateStr, {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
    } else {
      // 策略2: 点击 + 日历选择
      await EventSimulator.simulateDatePicker(picker as HTMLElement, dateStr, {
        delay: config.actionDelay,
      });
    }

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  // ============ 日期范围 ============

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
      // 尝试解析 "2025-01-01 ~ 2025-06-30" 格式
      const parts = String(rangeValue).split(/[~～\-—]/);
      startDate = parts[0]?.trim() || '';
      endDate = parts[1]?.trim() || '';
    }

    const picker = field.element.querySelector('.ant-picker') || field.element;
    const inputs = picker.querySelectorAll('input');

    if (inputs.length >= 2) {
      await EventSimulator.simulateTextInput(inputs[0], startDate, {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
      await EventSimulator.simulateTextInput(inputs[1], endDate, {
        useNativeSetter: true,
        delay: config.actionDelay,
      });
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.HYBRID);
  }

  // ============ 级联选择 ============

  private async fillCascader(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // value 可能是路径数组 ['北京', '朝阳区'] 或字符串 '北京/朝阳区'
    let path: string[];
    if (Array.isArray(value)) {
      path = value.map(String);
    } else {
      path = String(value).split(/[/,，]/).map((s) => s.trim());
    }

    const trigger = field.element.querySelector('.ant-cascader, .ant-select-selector') || field.element;

    await EventSimulator.simulateCascader(trigger as HTMLElement, path, {
      delay: config.actionDelay,
    });

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  // ============ 复选框/单选框 ============

  private async fillCheckable(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const targetValue = String(value ?? '');

    if (field.fieldType === 'checkbox_group' || field.fieldType === 'radio_group') {
      // 组选择：在组内找到对应选项并点击
      const group = field.element;
      const items = group.querySelectorAll(
        '.ant-checkbox-wrapper, .ant-radio-wrapper, .ant-checkbox-button-wrapper, .ant-radio-button-wrapper'
      );

      for (const item of items) {
        const label = item.textContent?.trim() || '';
        const shouldSelect = Array.isArray(value)
          ? value.some((v: unknown) => label.includes(String(v)))
          : label.includes(targetValue);

        if (shouldSelect) {
          const realInput = item.querySelector<HTMLInputElement>('input');
          if (realInput) {
            const currentChecked = realInput.checked;
            if (!currentChecked) {
              await EventSimulator.simulateCheckable(item as HTMLElement, true, {
                delay: config.actionDelay,
              });
            }
          }
        }
      }
    } else {
      // 单个 checkbox/radio
      await EventSimulator.simulateCheckable(field.element, true, {
        delay: config.actionDelay,
      });
    }

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }

  // ============ Switch ============

  private async fillSwitch(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    const targetChecked = Boolean(value);

    await EventSimulator.simulateSwitch(field.element, targetChecked, {
      delay: config.actionDelay,
    });

    if (config.highlightFilled) {
      this.highlight(field.element, config.highlightColor);
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }

  // ============ 文件上传 ============

  private async fillUpload(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();

    // 查找隐藏的 input[type=file]
    const fileInput = field.element.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) {
      return this.errorResult(field.label, Date.now() - startTime, 'File input not found', FillStrategy.DOM_EVENT);
    }

    // 如果有 File 对象
    if (value instanceof File) {
      EventSimulator.simulateFileUpload(fileInput, [value]);
    } else if (typeof value === 'string' && value) {
      // URL - 通过 fetch 下载后构造 File
      try {
        const response = await fetch(value);
        const blob = await response.blob();
        const fileName = value.split('/').pop() || 'file';
        const file = new File([blob], fileName, { type: blob.type });
        EventSimulator.simulateFileUpload(fileInput, [file]);
      } catch {
        return this.errorResult(field.label, Date.now() - startTime, 'Failed to download file', FillStrategy.DOM_EVENT);
      }
    }

    return this.successResult(field.label, Date.now() - startTime, FillStrategy.DOM_EVENT);
  }
}
