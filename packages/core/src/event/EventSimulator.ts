// ===== packages/core/src/event/EventSimulator.ts =====
/**
 * 事件模拟器
 *
 * 模拟真实用户操作的事件链，兼容 React / Vue / Angular 等主流框架。
 *
 * 关键设计原则：
 * 1. 完整事件链：focus → input → change → blur
 * 2. 所有事件设置 bubbles: true（确保能被框架的事件代理捕获）
 * 3. 使用原生 setter 绕过框架的 value 拦截
 * 4. 事件间添加适当延迟，确保框架有时间响应
 */

import { NativeSetter } from './NativeSetter.js';
import type {
  SimulateOptions,
  SimulateResult,
  SelectSimulateOptions,
  DatePickerSimulateOptions,
} from '@auto-form-filler/shared/types';

export class EventSimulator {
  // ==================== 文本输入 ====================

  /**
   * 模拟文本输入（完整事件链）
   *
   * 事件链：focus → input → change → blur
   * 适用于：input[type=text], input[type=email], input[type=number], textarea
   */
  static async simulateTextInput(
    element: HTMLElement,
    value: string,
    options: SimulateOptions = {}
  ): Promise<SimulateResult> {
    const {
      focus = true,
      blur = true,
      delay = 50,
      useNativeSetter = true,
      extraEvents = [],
    } = options;

    const eventsFired: string[] = [];
    const inputEl = element as HTMLInputElement | HTMLTextAreaElement;

    try {
      // Step 1: focus
      if (focus) {
        element.focus();
        element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        eventsFired.push('focus');
        await this.sleep(delay);
      }

      // Step 2: 使用原生 setter 设置值
      if (
        useNativeSetter &&
        (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
      ) {
        NativeSetter.setNativeValue(inputEl, value);
      } else {
        (element as HTMLInputElement).value = value;
      }

      // Step 3: 触发 input 事件（关键！React/Vue 都监听此事件）
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      element.dispatchEvent(inputEvent);
      eventsFired.push('input');
      await this.sleep(delay);

      // Step 4: 触发 change 事件
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      element.dispatchEvent(changeEvent);
      eventsFired.push('change');
      await this.sleep(delay);

      // Step 5: 额外事件
      for (const evt of extraEvents) {
        element.dispatchEvent(new Event(evt.type, evt.init));
        eventsFired.push(evt.type);
        await this.sleep(delay);
      }

      // Step 6: blur
      if (blur) {
        element.blur();
        element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        eventsFired.push('blur');
      }

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 下拉选择 ====================

  /**
   * 模拟下拉选择
   *
   * 挑战：框架封装的 Select 组件（如 Ant Design Select）并非原生 <select>，
   * 而是 div 构建的虚拟下拉框。
   *
   * 流程：
   * 1. 点击触发器打开下拉
   * 2. 等待下拉选项渲染
   * 3. 在 dropdown 中查找目标选项
   * 4. 点击选项
   * 5. 触发 change 事件
   */
  static async simulateSelect(
    triggerElement: HTMLElement,
    value: string | string[],
    options: SelectSimulateOptions = {}
  ): Promise<SimulateResult> {
    const eventsFired: string[] = [];
    const {
      focus = true,
      delay = 100,
      triggerEvent = 'mousedown',
      optionSelector,
      optionMatchFn,
    } = options;

    try {
      // Step 1: focus
      if (focus) {
        triggerElement.focus();
        triggerElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        eventsFired.push('focus');
        await this.sleep(delay);
      }

      // Step 2: 点击触发器打开下拉
      const triggerMouseEvent = new MouseEvent(triggerEvent, {
        bubbles: true,
        cancelable: true,
      });
      triggerElement.dispatchEvent(triggerMouseEvent);
      eventsFired.push(triggerEvent);
      await this.sleep(delay * 2);

      // Step 3: 查找并点击选项
      const values = Array.isArray(value) ? value : [value];
      for (const val of values) {
        const option = this.findSelectOption(val, optionSelector, optionMatchFn);
        if (option) {
          option.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true, cancelable: true })
          );
          option.dispatchEvent(
            new MouseEvent('mouseup', { bubbles: true, cancelable: true })
          );
          option.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
          );
          eventsFired.push('click(option)');
          await this.sleep(delay);
        } else {
          eventsFired.push('option-not-found');
        }
      }

      // Step 4: 关闭下拉（Escape）
      triggerElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      eventsFired.push('keydown(Escape)');
      await this.sleep(delay);

      // Step 5: change 事件
      triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
      eventsFired.push('change');

      // Step 6: blur
      triggerElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      eventsFired.push('blur');

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 日期选择器 ====================

  /**
   * 模拟日期选择器
   *
   * 策略1: 尝试直接 input 赋值（适用于支持直接输入的日期选择器）
   * 策略2: 点击触发 + 日历面板选择（适用于纯选择的日期选择器）
   */
  static async simulateDatePicker(
    triggerElement: HTMLElement,
    dateValue: string,
    options: DatePickerSimulateOptions = {}
  ): Promise<SimulateResult> {
    const { delay = 100 } = options;
    const eventsFired: string[] = [];

    try {
      // 策略1: 尝试直接 input 赋值
      const inputEl = triggerElement.querySelector('input') || triggerElement;
      if (inputEl instanceof HTMLInputElement) {
        await this.simulateTextInput(inputEl, dateValue, {
          delay,
          useNativeSetter: true,
        });
        return {
          success: true,
          eventsFired: ['input', 'change'],
        };
      }

      // 策略2: 点击 + 日历面板选择
      triggerElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      eventsFired.push('click');
      await this.sleep(delay * 2);

      // 尝试多种日历选择器格式
      const daySelectors = [
        `[title="${dateValue}"]`,
        `.ant-picker-cell[title="${dateValue}"]`,
        `.el-date-table td[data-date="${dateValue}"]`,
        `.el-picker-panel__body td:has-text("${dateValue.split('-')[2]}")`,
      ];

      for (const sel of daySelectors) {
        try {
          const cell = document.querySelector(sel);
          if (cell instanceof HTMLElement) {
            cell.click();
            eventsFired.push('click(date)');
            break;
          }
        } catch {
          // 选择器无效，继续尝试
        }
      }

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 级联选择器 ====================

  /**
   * 模拟级联选择器
   *
   * 逐级展开菜单 → 选择每一级 → 最终选择末级
   */
  static async simulateCascader(
    triggerElement: HTMLElement,
    path: string[],
    options: SimulateOptions = {}
  ): Promise<SimulateResult> {
    const { delay = 150 } = options;
    const eventsFired: string[] = [];

    try {
      // Step 1: 点击触发器打开第一级
      triggerElement.focus();
      triggerElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      eventsFired.push('click(trigger)');
      await this.sleep(delay * 2);

      // Step 2: 逐级选择
      for (let i = 0; i < path.length; i++) {
        const level = i + 1;
        const targetText = path[i];

        // 查找当前级联面板中的选项
        const menus = document.querySelectorAll(
          `.ant-cascader-menu:nth-child(${level}), .el-cascader-menu:nth-child(${level}), .el-cascader-node`
        );

        let found = false;
        for (const menu of menus) {
          const items = menu.querySelectorAll('li, .el-cascader-node');
          for (const item of items) {
            if (item.textContent?.trim() === targetText) {
              (item as HTMLElement).dispatchEvent(
                new MouseEvent('mouseenter', { bubbles: true })
              );
              await this.sleep(50);
              (item as HTMLElement).dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              );
              eventsFired.push(`click(level-${level})`);
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          return {
            success: false,
            eventsFired,
            error: new Error(`Cascader level ${level}: "${targetText}" not found`),
          };
        }

        await this.sleep(delay);
      }

      // Step 3: 关闭
      triggerElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      eventsFired.push('keydown(Escape)');

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 单选框/复选框 ====================

  /**
   * 模拟单选框 / 复选框
   */
  static async simulateCheckable(
    element: HTMLElement,
    checked: boolean,
    options: SimulateOptions = {}
  ): Promise<SimulateResult> {
    const { delay = 30 } = options;
    const eventsFired: string[] = [];

    try {
      // 查找内部实际的 input 元素
      const realInput =
        element.querySelector<HTMLInputElement>('input[type="checkbox"], input[type="radio"]') ||
        (element instanceof HTMLInputElement ? element : null);

      if (realInput) {
        realInput.checked = checked;
        NativeSetter.setNativeValue(realInput, realInput.value);
      }

      // 点击事件
      element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      );
      eventsFired.push('click');
      await this.sleep(delay);

      // change 事件
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      eventsFired.push('change');

      if (realInput) {
        realInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        realInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      }

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 文件上传 ====================

  /**
   * 模拟文件上传
   */
  static simulateFileUpload(
    fileInput: HTMLInputElement,
    files: File[]
  ): SimulateResult {
    const eventsFired: string[] = [];

    try {
      const dt = new DataTransfer();
      for (const f of files) {
        dt.items.add(f);
      }
      fileInput.files = dt.files;

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      eventsFired.push('change');
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      eventsFired.push('input');

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== Switch 开关 ====================

  /**
   * 模拟 Switch 开关切换
   */
  static async simulateSwitch(
    element: HTMLElement,
    value: boolean,
    options: SimulateOptions = {}
  ): Promise<SimulateResult> {
    const eventsFired: string[] = [];
    const { delay = 30 } = options;

    try {
      // 找到实际的 checkbox input
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        const currentChecked = checkbox.checked;
        if (currentChecked !== value) {
          // 需要切换
          element.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
          );
          eventsFired.push('click');
          await this.sleep(delay);

          checkbox.checked = value;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          eventsFired.push('change');
        }
      }

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 键盘输入模拟（逐字符输入） ====================

  /**
   * 逐字符键盘输入模拟（用于触发实时搜索等场景）
   */
  static async simulateTyping(
    element: HTMLElement,
    text: string,
    options: SimulateOptions & { typingDelay?: number } = {}
  ): Promise<SimulateResult> {
    const { delay = 30, typingDelay = 30, useNativeSetter = true } = options;
    const eventsFired: string[] = [];
    const inputEl = element as HTMLInputElement | HTMLTextAreaElement;

    try {
      element.focus();
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      eventsFired.push('focus');
      await this.sleep(delay);

      // 先清空
      if (useNativeSetter && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        NativeSetter.setNativeValue(inputEl, '');
      } else {
        (element as HTMLInputElement).value = '';
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // 逐字符输入
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const currentValue = text.substring(0, i + 1);

        // keydown
        element.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: char,
            bubbles: true,
            cancelable: true,
          })
        );

        // 设置累积值
        if (useNativeSetter && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
          NativeSetter.setNativeValue(inputEl, currentValue);
        } else {
          (element as HTMLInputElement).value = currentValue;
        }

        // input 事件（每次字符输入后触发）
        element.dispatchEvent(new Event('input', { bubbles: true }));

        // keyup
        element.dispatchEvent(
          new KeyboardEvent('keyup', {
            key: char,
            bubbles: true,
          })
        );

        eventsFired.push(`keypress(${i})`);
        await this.sleep(typingDelay);
      }

      // change
      element.dispatchEvent(new Event('change', { bubbles: true }));
      eventsFired.push('change');

      // blur
      element.blur();
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      eventsFired.push('blur');

      return { success: true, eventsFired };
    } catch (error) {
      return { success: false, eventsFired, error: error as Error };
    }
  }

  // ==================== 辅助方法 ====================

  /** 延时 */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** 查找下拉选项元素 */
  private static findSelectOption(
    value: string,
    optionSelector?: string,
    optionMatchFn?: (el: HTMLElement, val: string) => boolean
  ): HTMLElement | null {
    // 优先使用自定义匹配函数
    if (optionMatchFn) {
      const allOptions = document.querySelectorAll(
        optionSelector ||
          '[role="option"], .ant-select-item, .el-select-dropdown__item, li[role="option"]'
      );
      for (const opt of allOptions) {
        if (optionMatchFn(opt as HTMLElement, value)) {
          return opt as HTMLElement;
        }
      }
      return null;
    }

    // 默认：文本内容匹配
    const selectors = [
      `.ant-select-item-option[title="${value}"]`,
      `.ant-select-item-option-content:has-text("${value}")`,
      `.el-select-dropdown__item:has-text("${value}")`,
      `[role="option"]:has-text("${value}")`,
      `li[role="option"]:has-text("${value}")`,
      `option[value="${value}"]`,
    ];

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el as HTMLElement;
      } catch {
        continue;
      }
    }

    // 最终兜底：遍历所有可能的选项元素，按文本匹配
    const candidates = document.querySelectorAll(
      optionSelector ||
        '.ant-select-item-option, .el-select-dropdown__item, [role="option"], li'
    );
    for (const candidate of candidates) {
      if (candidate.textContent?.trim() === value) {
        return candidate as HTMLElement;
      }
    }

    return null;
  }
}
