// ===== packages/sites/src/index.ts =====
/**
 * 站点注册中心
 *
 * 管理所有招聘网站的站点配置。
 * 根据当前页面 URL 自动匹配对应的站点配置。
 */

import type { SiteConfig } from './base/types.js';
import { BossZhipinConfig } from './boss/BossZhipinConfig.js';
import { ZhilianConfig } from './zhilian/ZhilianConfig.js';
import { LiepinConfig } from './liepin/LiepinConfig.js';
import { Job51Config } from './job51/Job51Config.js';
import { LagouConfig } from './lagou/LagouConfig.js';

export class SiteRegistry {
  private static instance: SiteRegistry;
  private sites: SiteConfig[] = [];

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): SiteRegistry {
    if (!SiteRegistry.instance) {
      SiteRegistry.instance = new SiteRegistry();
    }
    return SiteRegistry.instance;
  }

  /** 注册默认站点 */
  private registerDefaults(): void {
    this.register(new BossZhipinConfig());
    this.register(new ZhilianConfig());
    this.register(new LiepinConfig());
    this.register(new Job51Config());
    this.register(new LagouConfig());
  }

  /** 注册站点配置 */
  register(site: SiteConfig): void {
    this.sites.push(site);
  }

  /** 根据 URL 匹配站点配置 */
  match(url: string): SiteConfig | null {
    for (const site of this.sites) {
      for (const pattern of site.urlPatterns) {
        if (pattern.test(url)) {
          return site;
        }
      }
    }
    return null;
  }

  /** 获取所有已注册站点 */
  getAllSites(): SiteConfig[] {
    return [...this.sites];
  }
}

// 导出所有站点配置类和注册表
export { BaseSiteConfig } from './base/BaseSiteConfig.js';
export type { SiteConfig, FieldSelectorConfig } from './base/types.js';

export { BossZhipinConfig } from './boss/BossZhipinConfig.js';
export { ZhilianConfig } from './zhilian/ZhilianConfig.js';
export { LiepinConfig } from './liepin/LiepinConfig.js';
export { Job51Config } from './job51/Job51Config.js';
export { LagouConfig } from './lagou/LagouConfig.js';
