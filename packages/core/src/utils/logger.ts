// ===== packages/core/src/utils/logger.ts =====
// 日志工具

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static prefix = '[AutoFormFiller]';

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static debug(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} [DEBUG] ${msg}`, ...args);
    }
  }

  static info(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} [INFO] ${msg}`, ...args);
    }
  }

  static warn(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} [WARN] ${msg}`, ...args);
    }
  }

  static error(msg: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} [ERROR] ${msg}`, ...args);
    }
  }

  static group(label: string): void {
    console.group(`${this.prefix} ${label}`);
  }

  static groupEnd(): void {
    console.groupEnd();
  }
}
