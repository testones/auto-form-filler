// ===== auto-form-filler shared/types/field.ts =====
// 表单字段相关类型

/** 检测到的表单字段 */
export interface DetectedField {
  /** DOM 元素引用 */
  element: HTMLElement;
  /** 字段类型 */
  fieldType: FieldType;
  /** 提取的标签文本 */
  label: string;
  /** 标签关联的 for/id 属性 */
  labelFor?: string;
  /** placeholder 文本 */
  placeholder?: string;
  /** name 属性 */
  name?: string;
  /** 是否为必填 */
  required: boolean;
  /** 所属框架组件类型 */
  componentType?: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 父级表单项容器 */
  container?: HTMLElement;
  /** 额外属性 */
  attributes: Record<string, string>;
}

/** 表单字段类型枚举 */
export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  PASSWORD = 'password',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE_PICKER = 'date_picker',
  DATE_RANGE = 'date_range',
  TIME_PICKER = 'time_picker',
  CASCADER = 'cascader',
  CHECKBOX = 'checkbox',
  CHECKBOX_GROUP = 'checkbox_group',
  RADIO = 'radio',
  RADIO_GROUP = 'radio_group',
  SWITCH = 'switch',
  SLIDER = 'slider',
  FILE_UPLOAD = 'file_upload',
  IMAGE_UPLOAD = 'image_upload',
  RICH_TEXT = 'rich_text',
  TREE_SELECT = 'tree_select',
  UNKNOWN = 'unknown',
}

/** 字段标签匹配结果 */
export interface FieldLabelMatch {
  fieldKey: string;
  confidence: number;
  matchType: 'exact' | 'keyword' | 'fuzzy' | 'placeholder' | 'name' | 'context';
  matchedText: string;
}

/** 匹配后的字段（关联简历数据字段） */
export interface MatchedField {
  detectedField: DetectedField;
  resumeFieldKey: string;
  confidence: number;
  adapter: string;
  fillStrategy: FillStrategy;
}

/** 填充策略 */
export enum FillStrategy {
  DIRECT_INPUT = 'direct_input',
  NATIVE_SETTER = 'native_setter',
  COMPONENT_API = 'component_api',
  DOM_EVENT = 'dom_event',
  CLICK_SELECT = 'click_select',
  HYBRID = 'hybrid',
}
