// ===== packages/core/src/field/LabelParser.ts =====
/**
 * 标签解析器 - 通过 NLP 语义匹配识别字段含义
 *
 * 策略层级（从高到低）：
 * 1. 精确匹配：label === '姓名'
 * 2. 关键词匹配：label 包含 '姓名'/'名字'/'name'
 * 3. 模糊匹配：编辑距离 < 阈值
 * 4. Placeholder 匹配
 * 5. Name 属性匹配
 * 6. 上下文推断（相邻标签）
 */

import type { FieldLabelMatch } from '@auto-form-filler/shared/types';
import { FIELD_LABEL_DICTIONARY } from '@auto-form-filler/shared/constants';

export class LabelParser {
  /**
   * 解析标签文本，匹配到简历字段
   */
  static parse(
    labelText: string,
    placeholder?: string,
    name?: string
  ): FieldLabelMatch | null {
    // 清理和标准化文本
    const normalizedLabel = this.normalize(labelText);

    // 跳过无意义的标签
    if (!normalizedLabel || normalizedLabel.length < 1) return null;

    // 策略1: 精确匹配
    const exactMatch = this.tryExactMatch(normalizedLabel, labelText);
    if (exactMatch) return exactMatch;

    // 策略2: 关键词匹配
    const keywordMatch = this.tryKeywordMatch(normalizedLabel, labelText);
    if (keywordMatch) return keywordMatch;

    // 策略3: Placeholder 匹配
    if (placeholder) {
      const placeholderMatch = this.tryPlaceholderMatch(placeholder);
      if (placeholderMatch) return placeholderMatch;
    }

    // 策略4: Name 属性匹配
    if (name) {
      const nameMatch = this.tryNameMatch(name);
      if (nameMatch) return nameMatch;
    }

    return null;
  }

  /** 精确匹配：label 与词典中的某个别名完全相同 */
  private static tryExactMatch(
    normalizedLabel: string,
    originalLabel: string
  ): FieldLabelMatch | null {
    for (const [fieldKey, aliases] of Object.entries(FIELD_LABEL_DICTIONARY)) {
      for (const alias of aliases) {
        if (this.normalize(alias) === normalizedLabel) {
          return {
            fieldKey,
            confidence: 1.0,
            matchType: 'exact',
            matchedText: originalLabel,
          };
        }
      }
    }
    return null;
  }

  /** 关键词匹配：label 包含词典中的某个别名 */
  private static tryKeywordMatch(
    normalizedLabel: string,
    originalLabel: string
  ): FieldLabelMatch | null {
    let bestMatch: FieldLabelMatch | null = null;
    let bestLength = 0;

    for (const [fieldKey, aliases] of Object.entries(FIELD_LABEL_DICTIONARY)) {
      for (const alias of aliases) {
        const normalizedAlias = this.normalize(alias);
        if (normalizedLabel.includes(normalizedAlias) && normalizedAlias.length > bestLength) {
          bestLength = normalizedAlias.length;
          bestMatch = {
            fieldKey,
            confidence: 0.85,
            matchType: 'keyword',
            matchedText: alias,
          };
        }
      }
    }

    return bestMatch;
  }

  /** Placeholder 匹配 */
  private static tryPlaceholderMatch(placeholder: string): FieldLabelMatch | null {
    const normalized = this.normalize(placeholder);
    if (!normalized) return null;

    for (const [fieldKey, aliases] of Object.entries(FIELD_LABEL_DICTIONARY)) {
      for (const alias of aliases) {
        if (normalized.includes(this.normalize(alias))) {
          return {
            fieldKey,
            confidence: 0.7,
            matchType: 'placeholder',
            matchedText: placeholder,
          };
        }
      }
    }
    return null;
  }

  /** Name 属性匹配 */
  private static tryNameMatch(name: string): FieldLabelMatch | null {
    const normalized = this.normalize(name);
    if (!normalized) return null;

    for (const [fieldKey, aliases] of Object.entries(FIELD_LABEL_DICTIONARY)) {
      for (const alias of aliases) {
        if (normalized.includes(this.normalize(alias))) {
          return {
            fieldKey,
            confidence: 0.65,
            matchType: 'name',
            matchedText: name,
          };
        }
      }
    }
    return null;
  }

  /** 文本标准化 */
  static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[：:：*·•\-/｜|（）()【】\[\]「」『』""'']/g, '');
  }
}
