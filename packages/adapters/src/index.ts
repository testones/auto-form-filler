// ===== packages/adapters/src/index.ts =====
/**
 * 适配器注册中心
 *
 * 采用注册表模式 (Registry Pattern)，管理所有框架适配器。
 * 支持：
 * 1. 按框架+UI库精确查找适配器
 * 2. 自动检测页面使用的框架
 * 3. 责任链模式：找不到精确匹配时回退到通用适配器
 */

import { BaseAdapter } from './base/BaseAdapter.js';
import type { AdapterCapability } from './base/types.js';

import { AntDesignAdapter } from './react/AntDesignAdapter.js';
import { ReactAdapter } from './react/ReactAdapter.js';
import { ElementUIAdapter } from './vue/ElementUIAdapter.js';
import { VueAdapter } from './vue/VueAdapter.js';
import { NativeAdapter } from './native/NativeAdapter.js';

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<string, BaseAdapter> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  /** 注册默认适配器 */
  private registerDefaults(): void {
    // React 生态
    this.register(new AntDesignAdapter());
    this.register(new ReactAdapter());

    // Vue 生态
    this.register(new ElementUIAdapter());
    this.register(new VueAdapter());

    // 兜底
    this.register(new NativeAdapter());
  }

  /** 注册适配器 */
  register(adapter: BaseAdapter): void {
    const key = `${adapter.capability.framework}:${adapter.capability.uiLibrary}`;
    this.adapters.set(key, adapter);
  }

  /** 获取适配器 */
  getAdapter(framework: string, uiLibrary: string): BaseAdapter | null {
    // 精确匹配
    const key = `${framework}:${uiLibrary}`;
    const exact = this.adapters.get(key);
    if (exact) return exact;

    // 回退到框架通用适配器
    const genericKey = `${framework}:custom`;
    const generic = this.adapters.get(genericKey);
    if (generic) return generic;

    // 最终回退到原生适配器
    return this.adapters.get('native:native') || null;
  }

  /** 自动检测并返回最合适的适配器 */
  detectAdapter(document: Document): BaseAdapter | null {
    // 按优先级检测
    const detectOrder = [
      { framework: 'react', uiLibrary: 'ant-design' },
      { framework: 'vue', uiLibrary: 'element-ui' },
      { framework: 'react', uiLibrary: 'custom' },
      { framework: 'vue', uiLibrary: 'custom' },
      { framework: 'angular', uiLibrary: 'material' },
      { framework: 'native', uiLibrary: 'native' },
    ];

    for (const { framework, uiLibrary } of detectOrder) {
      const adapter = this.getAdapter(framework, uiLibrary);
      if (adapter?.detect(document)) {
        return adapter;
      }
    }

    return this.getAdapter('native', 'native');
  }

  /** 获取所有已注册的适配器 */
  getAllAdapters(): BaseAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** 列出所有适配器能力 */
  listCapabilities(): AdapterCapability[] {
    return this.getAllAdapters().map((a) => a.capability);
  }
}

// 导出所有适配器类和注册表
export { BaseAdapter } from './base/BaseAdapter.js';
export type { AdapterCapability, FillContext, FillResult } from './base/types.js';

export { AntDesignAdapter } from './react/AntDesignAdapter.js';
export { ReactAdapter } from './react/ReactAdapter.js';
export { ElementUIAdapter } from './vue/ElementUIAdapter.js';
export { VueAdapter } from './vue/VueAdapter.js';
export { NativeAdapter } from './native/NativeAdapter.js';
