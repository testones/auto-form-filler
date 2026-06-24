// ===== auto-form-filler shared/types/messages.ts =====
// 通信消息类型（Chrome Extension + Userscript）

export enum MessageType {
  // Popup → Background
  GET_RESUME_DATA = 'GET_RESUME_DATA',
  SAVE_RESUME_DATA = 'SAVE_RESUME_DATA',
  DELETE_RESUME_DATA = 'DELETE_RESUME_DATA',

  // Background → Content Script
  FILL_FORM = 'FILL_FORM',
  DETECT_SITE = 'DETECT_SITE',
  STOP_FILL = 'STOP_FILL',

  // Content Script → Injected Script
  EXECUTE_FILL = 'EXECUTE_FILL',

  // Injected Script → Content Script
  FILL_PROGRESS = 'FILL_PROGRESS',
  FILL_COMPLETE = 'FILL_COMPLETE',
  FILL_ERROR = 'FILL_ERROR',
  SITE_DETECTED = 'SITE_DETECTED',
}

export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  requestId?: string;
  timestamp?: number;
}

/** 填充进度 */
export interface FillProgress {
  current: number;
  total: number;
  currentField: string;
  status: 'pending' | 'filling' | 'success' | 'error';
}

/** 填充完成报告 */
export interface FillCompleteReport {
  totalFields: number;
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  totalDuration: number;
  site: {
    name: string;
    url: string;
    framework: string;
    uiLibrary: string;
  };
}
