// ===== auto-form-filler shared/types/global.ts =====
// 全局类型定义

/** 平台 API 接口 - 抽象不同运行环境的差异 */
export interface PlatformAPI {
  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  fileReader: {
    readAsDataURL(blob: Blob): Promise<string>;
    readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer>;
  };
  http: {
    get(url: string): Promise<Response>;
    post(url: string, data: unknown): Promise<Response>;
  };
  logger: {
    info(msg: string, ...args: unknown[]): void;
    warn(msg: string, ...args: unknown[]): void;
    error(msg: string, ...args: unknown[]): void;
    debug(msg: string, ...args: unknown[]): void;
  };
  notification: {
    show(title: string, message: string): void;
  };
}

/** 填充配置 */
export interface FillConfig {
  actionDelay: number;
  enableAnimation: boolean;
  highlightFilled: boolean;
  highlightColor: string;
  maxRetries: number;
  skipFilled: boolean;
  fieldMappingOverrides?: Record<string, string>;
  abortSignal?: AbortSignal;
}

/** 默认填充配置 */
export const DEFAULT_FILL_CONFIG: FillConfig = {
  actionDelay: 100,
  enableAnimation: true,
  highlightFilled: true,
  highlightColor: '#1890ff',
  maxRetries: 2,
  skipFilled: true,
};
