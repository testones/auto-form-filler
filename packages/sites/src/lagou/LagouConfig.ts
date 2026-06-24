// ===== packages/sites/src/lagou/LagouConfig.ts =====
/**
 * 拉勾网 站点配置
 *
 * 技术栈: React + 自研组件
 * 简历页面: https://www.lagou.com/resume
 */

import { BaseSiteConfig } from '../base/BaseSiteConfig.js';

export class LagouConfig extends BaseSiteConfig {
  readonly name = '拉勾网';
  readonly domain = 'lagou.com';
  readonly framework = 'react' as const;
  readonly uiLibrary = 'custom';

  readonly urlPatterns = [
    /^https:\/\/www\.lagou\.com\/resume/,
    /^https:\/\/passport\.lagou\.com\/resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息
    'basicInfo.name': '[class*="name"] input, [class*="username"] input',
    'basicInfo.gender': '[class*="gender"] [class*="radio"], [class*="sex"] label',
    'basicInfo.birthDate': '[class*="birth"] input, [class*="birthday"] input',
    'basicInfo.phone': '[class*="phone"] input, [class*="mobile"] input',
    'basicInfo.email': '[class*="email"] input, [class*="mail"] input',
    'basicInfo.currentCity': '[class*="city"] [class*="select"], [class*="location"] [class*="select"]',
    'basicInfo.avatar': '[class*="avatar"] input[type="file"]',

    // 求职意向
    'jobPreference.jobTitle': '[class*="expect"] [class*="position"] input',
    'jobPreference.expectedCities': '[class*="expect"] [class*="city"] [class*="select"]',
    'jobPreference.expectedSalary': '[class*="expect"] [class*="salary"] input',
    'jobPreference.jobType': '[class*="job-type"] select, [class*="job"] [class*="nature"] select',

    // 教育经历
    'education.0.school': '[class*="edu"] [class*="school"] input',
    'education.0.degree': '[class*="edu"] [class*="degree"] select',
    'education.0.major': '[class*="edu"] [class*="major"] input',
    'education.0.startDate': '[class*="edu"] [class*="start"] input',
    'education.0.endDate': '[class*="edu"] [class*="end"] input',

    // 工作经历
    'workExperience.0.company': '[class*="work"] [class*="company"] input',
    'workExperience.0.title': '[class*="work"] [class*="position"] input',
    'workExperience.0.startDate': '[class*="work"] [class*="start"] input',
    'workExperience.0.endDate': '[class*="work"] [class*="end"] input',
    'workExperience.0.description': '[class*="work"] [class*="desc"] textarea',

    // 自我评价
    'additionalInfo.selfIntro': '[class*="self"] textarea, [class*="intro"] textarea',
  };

  getFormContainer(): HTMLElement | null {
    return (
      document.querySelector('[class*="resume-form"]') ||
      document.querySelector('[class*="resume"]') ||
      document.body
    );
  }
}
