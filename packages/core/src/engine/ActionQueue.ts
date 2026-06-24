// ===== packages/core/src/engine/ActionQueue.ts =====
/**
 * 操作队列
 *
 * 支持：
 * - 暂停 / 恢复
 * - 撤销已执行的操作
 * - 重试失败的操作
 */

export interface QueuedAction {
  id: string;
  name: string;
  execute: () => Promise<void>;
  undo?: () => Promise<void>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: Error;
  retryCount: number;
  maxRetries: number;
}

export class ActionQueue {
  private queue: QueuedAction[] = [];
  private executed: QueuedAction[] = [];
  private paused = false;
  private aborted = false;
  private pausePromise: Promise<void> | null = null;
  private pauseResolve: (() => void) | null = null;

  /** 添加操作到队列 */
  enqueue(action: Omit<QueuedAction, 'status' | 'retryCount'>): void {
    this.queue.push({
      ...action,
      status: 'pending',
      retryCount: 0,
    });
  }

  /** 批量添加操作 */
  enqueueAll(actions: Array<Omit<QueuedAction, 'status' | 'retryCount'>>): void {
    for (const action of actions) {
      this.enqueue(action);
    }
  }

  /** 执行队列中的所有操作 */
  async executeAll(
    onProgress?: (current: number, total: number, action: QueuedAction) => void
  ): Promise<QueuedAction[]> {
    const total = this.queue.length;

    for (let i = 0; i < this.queue.length; i++) {
      // 检查暂停
      if (this.paused) {
        await this.waitForResume();
      }

      // 检查中止
      if (this.aborted) {
        this.queue[i].status = 'skipped';
        continue;
      }

      const action = this.queue[i];
      action.status = 'running';
      onProgress?.(i + 1, total, action);

      try {
        await action.execute();
        action.status = 'completed';
        this.executed.push(action);
      } catch (error) {
        action.error = error as Error;

        // 重试
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          i--; // 重新执行
          continue;
        }

        action.status = 'failed';
      }
    }

    return this.queue;
  }

  /** 暂停执行 */
  pause(): void {
    this.paused = true;
    this.pausePromise = new Promise((resolve) => {
      this.pauseResolve = resolve;
    });
  }

  /** 恢复执行 */
  resume(): void {
    this.paused = false;
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pausePromise = null;
      this.pauseResolve = null;
    }
  }

  /** 中止执行 */
  abort(): void {
    this.aborted = true;
    this.resume(); // 如果有暂停也恢复，以便跳过
  }

  /** 撤销最近 N 个操作 */
  async undo(count = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      const action = this.executed.pop();
      if (action?.undo) {
        await action.undo();
        action.status = 'pending';
        this.queue.unshift(action);
      }
    }
  }

  /** 获取队列状态 */
  getStatus(): {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    skipped: number;
    isPaused: boolean;
    isAborted: boolean;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((a) => a.status === 'pending').length,
      completed: this.queue.filter((a) => a.status === 'completed').length,
      failed: this.queue.filter((a) => a.status === 'failed').length,
      skipped: this.queue.filter((a) => a.status === 'skipped').length,
      isPaused: this.paused,
      isAborted: this.aborted,
    };
  }

  /** 清空队列 */
  clear(): void {
    this.queue = [];
    this.executed = [];
    this.aborted = false;
  }

  private async waitForResume(): Promise<void> {
    if (this.pausePromise) {
      await this.pausePromise;
    }
  }
}
