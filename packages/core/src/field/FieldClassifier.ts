// ===== packages/core/src/field/FieldClassifier.ts =====
/**
 * 字段类型分类器
 *
 * 根据 DOM 元素的标签、属性、CSS class 等特征，判断它属于哪种表单控件类型
 */

import { FieldType } from '@auto-form-filler/shared/types';
import {
  ANT_DESIGN_SELECTORS,
  ELEMENT_UI_SELECTORS,
} from '@auto-form-filler/shared/constants';

export class FieldClassifier {
  /** 分类：根据元素特征判断字段类型 */
  static classify(element: HTMLElement): FieldType {
    // 先检查 CSS class 特征
    const classes = element.className?.toString() || '';
    const allClasses = `${classes} ${element.querySelector('input')?.className || ''}`;

    // 原生 HTML 元素
    if (element instanceof HTMLInputElement || element.querySelector('input')) {
      const input = element instanceof HTMLInputElement ? element : element.querySelector('input')!;
      const type = input.type?.toLowerCase();

      if (type === 'file') return FieldType.FILE_UPLOAD;
      if (type === 'checkbox') return FieldType.CHECKBOX;
      if (type === 'radio') return FieldType.RADIO;
      if (type === 'email') return FieldType.EMAIL;
      if (type === 'number') return FieldType.NUMBER;
      if (type === 'url') return FieldType.URL;
      if (type === 'password') return FieldType.PASSWORD;
      if (type === 'tel') return FieldType.PHONE;
      return FieldType.TEXT;
    }

    if (element instanceof HTMLTextAreaElement) return FieldType.TEXTAREA;
    if (element instanceof HTMLSelectElement) {
      return element.multiple ? FieldType.MULTI_SELECT : FieldType.SELECT;
    }

    // Ant Design 组件
    if (allClasses.includes('ant-select') || element.querySelector('.ant-select')) {
      // 检查是否多选
      if (allClasses.includes('ant-select-multiple') || element.querySelector('.ant-select-selection-overflow')) {
        return FieldType.MULTI_SELECT;
      }
      return FieldType.SELECT;
    }
    if (allClasses.includes('ant-picker') || element.querySelector('.ant-picker')) {
      if (allClasses.includes('ant-picker-range') || allClasses.includes('range')) {
        return FieldType.DATE_RANGE;
      }
      return FieldType.DATE_PICKER;
    }
    if (allClasses.includes('ant-cascader') || element.querySelector('.ant-cascader')) {
      return FieldType.CASCADER;
    }
    if (allClasses.includes('ant-checkbox-group') || element.querySelector('.ant-checkbox-group')) {
      return FieldType.CHECKBOX_GROUP;
    }
    if (allClasses.includes('ant-radio-group') || element.querySelector('.ant-radio-group')) {
      return FieldType.RADIO_GROUP;
    }
    if (allClasses.includes('ant-switch') || element.querySelector('.ant-switch')) {
      return FieldType.SWITCH;
    }
    if (allClasses.includes('ant-upload') || element.querySelector('.ant-upload')) {
      if (allClasses.includes('ant-upload-select-picture') || allClasses.includes('avatar')) {
        return FieldType.IMAGE_UPLOAD;
      }
      return FieldType.FILE_UPLOAD;
    }
    if (allClasses.includes('ant-input-number') || element.querySelector('.ant-input-number')) {
      return FieldType.NUMBER;
    }
    if (allClasses.includes('ant-tree-select') || element.querySelector('.ant-tree-select')) {
      return FieldType.TREE_SELECT;
    }

    // Element UI 组件
    if (allClasses.includes('el-select') || element.querySelector('.el-select')) {
      return FieldType.SELECT;
    }
    if (allClasses.includes('el-date-editor') || element.querySelector('.el-date-editor')) {
      return FieldType.DATE_PICKER;
    }
    if (allClasses.includes('el-cascader') || element.querySelector('.el-cascader')) {
      return FieldType.CASCADER;
    }
    if (allClasses.includes('el-checkbox-group') || element.querySelector('.el-checkbox-group')) {
      return FieldType.CHECKBOX_GROUP;
    }
    if (allClasses.includes('el-radio-group') || element.querySelector('.el-radio-group')) {
      return FieldType.RADIO_GROUP;
    }
    if (allClasses.includes('el-switch') || element.querySelector('.el-switch')) {
      return FieldType.SWITCH;
    }
    if (allClasses.includes('el-upload') || element.querySelector('.el-upload')) {
      return FieldType.FILE_UPLOAD;
    }

    // iView UI 组件（智联招聘使用）
    if (allClasses.includes('ivu-select') || element.querySelector('.ivu-select')) {
      return FieldType.SELECT;
    }
    if (allClasses.includes('ivu-date-picker') || element.closest('.ivu-date-picker')) {
      return FieldType.DATE_PICKER;
    }
    if (allClasses.includes('ivu-checkbox') || element.querySelector('.ivu-checkbox')) {
      return FieldType.CHECKBOX;
    }
    if (allClasses.includes('ivu-radio-group') || element.querySelector('.ivu-radio-group')) {
      return FieldType.RADIO_GROUP;
    }
    // 智联自研组件
    if (allClasses.includes('zp-radio') || element.querySelector('.zp-radio')) {
      return FieldType.RADIO_GROUP;
    }
    if (allClasses.includes('select-input') || element.querySelector('.select-input')) {
      return FieldType.SELECT;
    }

    // 通用特征
    if (element.getAttribute('role') === 'combobox' || element.getAttribute('role') === 'listbox') {
      return FieldType.SELECT;
    }
    if (element.getAttribute('role') === 'radiogroup') {
      return FieldType.RADIO_GROUP;
    }
    if (element.isContentEditable || element.querySelector('[contenteditable="true"]')) {
      return FieldType.RICH_TEXT;
    }

    return FieldType.TEXT;
  }

  /** 获取组件类型标识 */
  static getComponentType(element: HTMLElement): string {
    const classes = element.className?.toString() || '';
    const allClasses = `${classes} ${element.querySelector('input')?.className || ''}`;

    if (allClasses.includes('ant-select')) return 'ant-select';
    if (allClasses.includes('ant-picker')) return 'ant-picker';
    if (allClasses.includes('ant-cascader')) return 'ant-cascader';
    if (allClasses.includes('ant-checkbox')) return 'ant-checkbox';
    if (allClasses.includes('ant-radio')) return 'ant-radio';
    if (allClasses.includes('ant-switch')) return 'ant-switch';
    if (allClasses.includes('ant-upload')) return 'ant-upload';
    if (allClasses.includes('ant-input')) return 'ant-input';
    if (allClasses.includes('el-select')) return 'el-select';
    if (allClasses.includes('el-date-editor')) return 'el-date-editor';
    if (allClasses.includes('el-cascader')) return 'el-cascader';
    if (allClasses.includes('el-checkbox')) return 'el-checkbox';
    if (allClasses.includes('el-radio')) return 'el-radio';
    if (allClasses.includes('el-switch')) return 'el-switch';
    if (allClasses.includes('el-upload')) return 'el-upload';
    if (allClasses.includes('el-input')) return 'el-input';
    if (allClasses.includes('ivu-input')) return 'ivu-input';
    if (allClasses.includes('ivu-select')) return 'ivu-select';
    if (allClasses.includes('ivu-date-picker')) return 'ivu-date-picker';
    if (allClasses.includes('ivu-checkbox')) return 'ivu-checkbox';
    if (allClasses.includes('zp-radio')) return 'zp-radio';
    if (allClasses.includes('select-input')) return 'select-input';

    return 'native';
  }

  /** 计算字段检测置信度 */
  static getConfidence(element: HTMLElement, label: string): number {
    let confidence = 0.5;

    // 有 label 文本 → 置信度提高
    if (label) confidence += 0.2;

    // 有 name 属性 → 置信度提高
    if (element.getAttribute('name') || element.querySelector('input[name]')) {
      confidence += 0.1;
    }

    // 是标准表单元素 → 置信度提高
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      confidence += 0.1;
    }

    // 有 placeholder → 置信度提高
    if (element.getAttribute('placeholder')) {
      confidence += 0.05;
    }

    // 是必填字段 → 置信度提高
    if (
      element.hasAttribute('required') ||
      element.getAttribute('aria-required') === 'true'
    ) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }
}
