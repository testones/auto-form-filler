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

    console.log(`[AutoFormFiller] fillIvuSelect: 查找 "${targetValue}"`);

    // Step 1: 点击打开下拉（完整事件链）
    this.scrollIntoView(selectEl as HTMLElement);
    const triggerEl = trigger as HTMLElement;
    triggerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await this.sleep(50);
    triggerEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    await this.sleep(50);
    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await this.sleep(config.actionDelay * 3);

    // Step 2: 查找选项
    const options = document.querySelectorAll('.ivu-select-dropdown-list .ivu-select-item, .ivu-select-item:not(.ivu-select-item-selected)');
    let found = false;
    for (const opt of options) {
      const text = opt.textContent?.trim() || '';
      const matched = text === targetValue || text.includes(targetValue) ||
          this.matchGenderValue(text, targetValue) || this.matchDegreeValue(text, targetValue) ||
          this.matchPoliticalValue(text, targetValue);

      if (matched) {
        const optEl = opt as HTMLElement;
        optEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        optEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        optEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        optEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        found = true;
        console.log(`[AutoFormFiller]   ivu-select 选择: "${text}"`);
        await this.sleep(config.actionDelay);
        break;
      }
    }

    if (!found) {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    if (config.highlightFilled) this.highlight(selectEl as HTMLElement, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** 政治面貌值匹配 */
  private matchPoliticalValue(text: string, value: string): boolean {
    const map: Record<string, string[]> = {
      '群众': ['群众'], '团员': ['团员'], '党员': ['中共党员', '党员'],
    };
    const targets = map[value];
    return !!targets?.some(t => text.includes(t));
  }

  /** 智联 select-input 填充
   * 智联的城市选择器会弹出 s-dialog + s-cascader 级联对话框
   * 结构：省份(s-cascader__first-level) → 城市(s-cascader__second-level) → 区县(s-cascader__third-level)
   */
  private async fillSelectInput(context: FillContext): Promise<FillResult> {
    const { field, value, config } = context;
    const startTime = Date.now();
    const targetValue = String(value ?? '');

    const selectEl = field.element.closest('.select-input') || field.element;
    this.scrollIntoView(selectEl as HTMLElement);
    console.log(`[AutoFormFiller] fillSelectInput: 查找 "${targetValue}"`);

    // Step 1: 点击打开
    const el = selectEl as HTMLElement;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await this.sleep(50);
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    await this.sleep(50);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await this.sleep(config.actionDelay * 4);

    // Step 2: 检查是否弹出了 s-dialog 级联选择器
    const dialog = document.querySelector('.s-dialog:not([style*="display: none"])');

    if (dialog) {
      console.log('[AutoFormFiller] 检测到级联选择对话框');
      return await this.fillCascaderDialog(dialog as HTMLElement, targetValue, field, config, startTime);
    }

    // Step 3: 没有对话框，尝试普通下拉
    const dropdownContainers = [
      selectEl.parentElement?.querySelector('.s-region'),
      selectEl.closest('.job-target-edit__item')?.querySelector('.s-region'),
      document.querySelector('.s-region:not([style*="display: none"])'),
    ].filter(Boolean);

    let found = false;

    for (const container of dropdownContainers) {
      if (!container) continue;
      const items = container.querySelectorAll('li, .city-item, [class*="region"] li, a, span');
      for (const item of items) {
        const text = item.textContent?.trim() || '';
        if (text === targetValue || text.includes(targetValue)) {
          this.clickElement(item as HTMLElement);
          found = true;
          console.log(`[AutoFormFiller]   选择: "${text}"`);
          await this.sleep(config.actionDelay);
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    if (config.highlightFilled) this.highlight(selectEl as HTMLElement, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** 填充级联选择对话框（s-cascader） */
  private async fillCascaderDialog(
    dialog: HTMLElement,
    targetValue: string,
    field: FillContext['field'],
    config: FillContext['config'],
    startTime: number
  ): Promise<FillResult> {
    const cascader = dialog.querySelector('.s-cascader');

    if (cascader) {
      // 级联选择：省份 → 城市 → 区县
      // 先在第二级（城市列表）中查找目标城市
      const secondLevel = cascader.querySelector('.s-cascader__second-level');
      if (secondLevel) {
        const cityOptions = secondLevel.querySelectorAll('.s-cascader__option');
        let cityFound = false;

        for (const opt of cityOptions) {
          const text = opt.querySelector('p')?.textContent?.trim() || opt.textContent?.trim() || '';
          if (text === targetValue || text.includes(targetValue)) {
            console.log(`[AutoFormFiller]   城市级联: 点击 "${text}"`);
            this.clickElement(opt as HTMLElement);
            cityFound = true;
            await this.sleep(config.actionDelay * 2);
            break;
          }
        }

        // 如果第二级没找到，在第一级（省份）中查找
        if (!cityFound) {
          const firstLevel = cascader.querySelector('.s-cascader__first-level');
          if (firstLevel) {
            const provinceOptions = firstLevel.querySelectorAll('.s-cascader__option');
            for (const opt of provinceOptions) {
              const text = opt.querySelector('p')?.textContent?.trim() || opt.textContent?.trim() || '';
              if (text === targetValue || text.includes(targetValue)) {
                console.log(`[AutoFormFiller]   省份级联: 点击 "${text}"`);
                this.clickElement(opt as HTMLElement);
                await this.sleep(config.actionDelay * 2);

                // 点击省份后，第三级会显示该省的城市
                const thirdLevel = cascader.querySelector('.s-cascader__third-level, .s-cascader-horizontal-list');
                if (thirdLevel) {
                  // 点击 "全XX" 按钮（选择整个城市）
                  const allButton = thirdLevel.querySelector('.s-checkbutton__item');
                  if (allButton) {
                    console.log(`[AutoFormFiller]   选择全区: "${allButton.textContent?.trim()}"`);
                    this.clickElement(allButton as HTMLElement);
                    await this.sleep(config.actionDelay);
                  }
                }
                cityFound = true;
                break;
              }
            }
          }
        }

        if (cityFound) {
          // 在第三级选择 "全XX" （如果有）
          const thirdLevel = cascader.querySelector('.s-cascader__third-level, .s-cascader-horizontal-list');
          if (thirdLevel) {
            const allButton = thirdLevel.querySelector('.s-checkbutton__item');
            if (allButton) {
              const allText = allButton.textContent?.trim() || '';
              if (allText.startsWith('全')) {
                console.log(`[AutoFormFiller]   选择全区: "${allText}"`);
                this.clickElement(allButton as HTMLElement);
                await this.sleep(config.actionDelay);
              }
            }
          }
        }
      }
    }

    // 关闭对话框 — 点击关闭按钮
    await this.sleep(config.actionDelay);
    const closeBtn = dialog.querySelector('.s-dialog__icon, .s-icon-guanbi, .s-dialog__close, [class*="close"]');
    if (closeBtn) {
      console.log('[AutoFormFiller] 关闭级联对话框');
      this.clickElement(closeBtn as HTMLElement);
    } else {
      // 点击遮罩关闭
      const overlay = dialog.parentElement;
      if (overlay) {
        overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }
    await this.sleep(config.actionDelay);

    if (config.highlightFilled) this.highlight(field.element, config.highlightColor);
    return this.successResult(field.label, Date.now() - startTime, FillStrategy.CLICK_SELECT);
  }

  /** 完整点击事件链 */
  private clickElement(el: HTMLElement): void {
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
    console.log(`[AutoFormFiller] fillZpRadio: 查找 "${targetValue}", 共 ${items.length} 个选项`);

    for (const item of items) {
      const text = item.textContent?.trim() || '';
      const matched = text.includes(targetValue) || this.matchGenderValue(text, targetValue);
      console.log(`[AutoFormFiller]   选项: "${text}" matched=${matched}`);

      if (matched) {
        const el = item as HTMLElement;
        this.scrollIntoView(el);

        // 完整事件链：mouseenter → mousedown → mouseup → click
        // Vue 的 @click 绑定在 li 上，需要完整的鼠标事件链
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        await this.sleep(30);
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await this.sleep(config.actionDelay);

        console.log(`[AutoFormFiller]   已点击: "${text}"`);
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
