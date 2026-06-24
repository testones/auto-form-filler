// ===== packages/core/src/engine/FieldMatcher.ts =====
/**
 * 字段匹配器
 *
 * 将检测到的表单字段与简历数据字段进行智能匹配
 */

import type { DetectedField, MatchedField } from '@auto-form-filler/shared/types';
import { FillStrategy } from '@auto-form-filler/shared/types';
import { LabelParser } from '../field/LabelParser.js';
import type { FieldClassifier } from '../field/FieldClassifier.js';

export class FieldMatcher {
  private labelParser: LabelParser;

  constructor() {
    this.labelParser = new LabelParser();
  }

  /**
   * 将检测到的字段与简历数据字段进行匹配
   */
  match(detectedFields: DetectedField[]): MatchedField[] {
    const matched: MatchedField[] = [];
    const usedFieldKeys = new Set<string>();

    for (const field of detectedFields) {
      const labelMatch = LabelParser.parse(
        field.label,
        field.placeholder,
        field.name
      );

      if (!labelMatch) continue;

      // 避免同一字段重复匹配（取置信度更高的）
      if (usedFieldKeys.has(labelMatch.fieldKey)) {
        const existing = matched.find((m) => m.resumeFieldKey === labelMatch.fieldKey);
        if (existing && labelMatch.confidence > existing.confidence) {
          // 替换为置信度更高的匹配
          const idx = matched.indexOf(existing);
          if (idx >= 0) {
            matched.splice(idx, 1);
          }
        } else {
          continue;
        }
      }

      usedFieldKeys.add(labelMatch.fieldKey);

      matched.push({
        detectedField: field,
        resumeFieldKey: labelMatch.fieldKey,
        confidence: labelMatch.confidence * field.confidence,
        adapter: this.determineAdapter(field),
        fillStrategy: this.determineStrategy(field),
      });
    }

    // 按置信度降序排列
    return matched.sort((a, b) => b.confidence - a.confidence);
  }

  /** 根据组件类型确定适配器 */
  private determineAdapter(field: DetectedField): string {
    const ct = field.componentType || '';
    if (ct.startsWith('ant-')) return 'ant-design';
    if (ct.startsWith('el-')) return 'element-ui';
    if (ct.startsWith('arco-')) return 'arco-design';
    return 'native';
  }

  /** 根据字段类型确定填充策略 */
  private determineStrategy(field: DetectedField): FillStrategy {
    switch (field.fieldType) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'email':
      case 'phone':
      case 'url':
      case 'password':
        return FillStrategy.NATIVE_SETTER;

      case 'select':
      case 'multi_select':
      case 'tree_select':
        return FillStrategy.CLICK_SELECT;

      case 'date_picker':
      case 'date_range':
      case 'time_picker':
      case 'cascader':
        return FillStrategy.HYBRID;

      case 'radio':
      case 'radio_group':
      case 'checkbox':
      case 'checkbox_group':
      case 'switch':
        return FillStrategy.DOM_EVENT;

      case 'file_upload':
      case 'image_upload':
        return FillStrategy.DOM_EVENT;

      case 'rich_text':
        return FillStrategy.COMPONENT_API;

      default:
        return FillStrategy.NATIVE_SETTER;
    }
  }
}
