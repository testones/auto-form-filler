// ===== auto-form-filler shared/constants/site-urls.ts =====
// 站点 URL 匹配规则

export interface SiteUrlRule {
  /** 站点名称 */
  name: string;
  /** 域名 */
  domain: string;
  /** URL 匹配正则 */
  patterns: RegExp[];
  /** 使用的 UI 框架 */
  framework: 'react' | 'vue' | 'angular' | 'native';
  /** 使用的 UI 库 */
  uiLibrary: string;
}

/** 支持的招聘网站配置 */
export const SITE_URL_RULES: SiteUrlRule[] = [
  {
    name: 'BOSS直聘',
    domain: 'zhipin.com',
    patterns: [
      /^https:\/\/www\.zhipin\.com\/web\/geek\/resume/,
      /^https:\/\/www\.zhipin\.com\/web\/user\/.*\/resume/,
      /^https:\/\/www\.zhipin\.com\/c101/,
    ],
    framework: 'react',
    uiLibrary: 'custom',
  },
  {
    name: '智联招聘',
    domain: 'zhaopin.com',
    patterns: [
      /^https:\/\/i\.zhaopin\.com\/resume/,
      /^https:\/\/rd5\.zhaopin\.com\/resume/,
      /^https:\/\/www\.zhaopin\.com\/resume/,
    ],
    framework: 'vue',
    uiLibrary: 'element-ui',
  },
  {
    name: '猎聘',
    domain: 'liepin.com',
    patterns: [
      /^https:\/\/c\.liepin\.com\/resume/,
      /^https:\/\/v\.liepin\.com\/resume/,
      /^https:\/\/www\.liepin\.com\/resume/,
    ],
    framework: 'react',
    uiLibrary: 'ant-design',
  },
  {
    name: '前程无忧',
    domain: '51job.com',
    patterns: [
      /^https:\/\/ehire\.51job\.com\/resume/,
      /^https:\/\/my\.51job\.com\/resume/,
      /^https:\/\/www\.51job\.com\/resume/,
    ],
    framework: 'vue',
    uiLibrary: 'custom',
  },
  {
    name: '拉勾网',
    domain: 'lagou.com',
    patterns: [
      /^https:\/\/www\.lagou\.com\/resume/,
      /^https:\/\/passport\.lagou\.com\/resume/,
    ],
    framework: 'react',
    uiLibrary: 'custom',
  },
];

/** 根据 URL 匹配站点规则 */
export function matchSiteRule(url: string): SiteUrlRule | null {
  for (const rule of SITE_URL_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(url)) {
        return rule;
      }
    }
  }
  return null;
}
