// ===== packages/core/src/event/event-chains.ts =====
// 预定义事件链

import type { EventChainStep } from '@auto-form-filler/shared/types';
import { EventChainType } from '@auto-form-filler/shared/types';

/**
 * 预定义事件链
 * 每种控件类型对应一组标准事件序列
 */
export const EVENT_CHAINS: Record<EventChainType, EventChainStep[]> = {
  [EventChainType.TEXT_INPUT]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'input', eventClass: Event, init: { bubbles: true }, delay: 50 },
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
    { eventType: 'blur', eventClass: FocusEvent, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.SELECT]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'mousedown', eventClass: MouseEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'mouseup', eventClass: MouseEvent, init: { bubbles: true }, delay: 100 },
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 200 },
    // 选项点击在适配器中处理
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
    { eventType: 'blur', eventClass: FocusEvent, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.MULTI_SELECT]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'mousedown', eventClass: MouseEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 200 },
    // 逐个选项点击
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
    { eventType: 'blur', eventClass: FocusEvent, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.DATE_PICKER]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 300 },
    // 日历面板操作由具体适配器处理
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
  ],

  [EventChainType.DATE_RANGE]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 300 },
    // 开始日期选择
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 100 },
    // 结束日期选择
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
  ],

  [EventChainType.CASCADER]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 300 },
    // 逐级选择由适配器处理
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
  ],

  [EventChainType.CHECKBOX]: [
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 30 },
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.RADIO]: [
    { eventType: 'click', eventClass: MouseEvent, init: { bubbles: true }, delay: 30 },
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.FILE_UPLOAD]: [
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 0 },
    { eventType: 'input', eventClass: Event, init: { bubbles: true }, delay: 0 },
  ],

  [EventChainType.RICH_TEXT]: [
    { eventType: 'focus', eventClass: FocusEvent, init: { bubbles: true }, delay: 50 },
    { eventType: 'input', eventClass: Event, init: { bubbles: true }, delay: 100 },
    { eventType: 'change', eventClass: Event, init: { bubbles: true }, delay: 50 },
    { eventType: 'blur', eventClass: FocusEvent, init: { bubbles: true }, delay: 0 },
  ],
};
