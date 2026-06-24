// ===== auto-form-filler shared/types/events.ts =====
// 事件模拟相关类型

/** 事件链类型 */
export enum EventChainType {
  TEXT_INPUT = 'text_input',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE_PICKER = 'date_picker',
  DATE_RANGE = 'date_range',
  CASCADER = 'cascader',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE_UPLOAD = 'file_upload',
  RICH_TEXT = 'rich_text',
}

/** 事件链步骤 */
export interface EventChainStep {
  eventType: string;
  eventClass: typeof Event | typeof FocusEvent | typeof MouseEvent | typeof KeyboardEvent | typeof InputEvent;
  init?: EventInit | MouseEventInit | KeyboardEventInit | InputEventInit;
  delay?: number;
  condition?: (element: HTMLElement) => boolean;
}

/** 模拟选项 */
export interface SimulateOptions {
  focus?: boolean;
  blur?: boolean;
  delay?: number;
  useNativeSetter?: boolean;
  extraEvents?: Array<{ type: string; init?: EventInit }>;
}

/** 模拟结果 */
export interface SimulateResult {
  success: boolean;
  eventsFired: string[];
  error?: Error;
}

/** Select 模拟额外选项 */
export interface SelectSimulateOptions extends SimulateOptions {
  optionSelector?: string;
  optionMatchFn?: (el: HTMLElement, val: string) => boolean;
  dropdownSelector?: string;
  triggerEvent?: 'click' | 'mousedown' | 'focus';
}

/** DatePicker 模拟额外选项 */
export interface DatePickerSimulateOptions extends SimulateOptions {
  dateFormat?: string;
  pickerSelector?: string;
}
