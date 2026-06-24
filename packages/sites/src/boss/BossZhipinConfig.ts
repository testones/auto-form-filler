// ===== packages/sites/src/boss/BossZhipinConfig.ts =====
/**
 * BOSS直聘 站点配置
 *
 * 技术栈: React + 自研组件
 * 简历页面: https://www.zhipin.com/web/geek/resume
 */

import { BaseSiteConfig } from '../base/BaseSiteConfig.js';

export class BossZhipinConfig extends BaseSiteConfig {
  readonly name = 'BOSS直聘';
  readonly domain = 'zhipin.com';
  readonly framework = 'react' as const;
  readonly uiLibrary = 'custom';

  readonly urlPatterns = [
    /^https:\/\/www\.zhipin\.com\/web\/geek\/resume/,
    /^https:\/\/www\.zhipin\.com\/web\/user\/.*\/resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息
    'basicInfo.name': '.resume-name-input input, [class*="name"] input',
    'basicInfo.gender': '[class*="gender"] [class*="radio"], [class*="sex"] [class*="radio"]',
    'basicInfo.birthDate': '[class*="birth"] input, [class*="birthday"] input',
    'basicInfo.phone': '[class*="phone"] input, [class*="mobile"] input',
    'basicInfo.email': '[class*="email"] input, [class*="mail"] input',
    'basicInfo.currentCity': '[class*="city"] [class*="select"], [class*="location"] [class*="select"]',
    'basicInfo.avatar': '[class*="avatar"] input[type="file"]',

    // 求职意向
    'jobPreference.jobTitle': '[class*="expect"] [class*="position"] input, [class*="job-title"] input',
    'jobPreference.expectedCities': '[class*="expect"] [class*="city"] [class*="select"]',
    'jobPreference.expectedSalary': '[class*="expect"] [class*="salary"] input',
    'jobPreference.jobType': '[class*="job-type"] [class*="select"], [class*="job"] [class*="nature"]',
    'jobPreference.jobStatus': '[class*="status"] [class*="select"]',

    // 教育经历
    'education.0.school': '[class*="edu"] [class*="school"] input',
    'education.0.degree': '[class*="edu"] [class*="degree"] [class*="select"]',
    'education.0.major': '[class*="edu"] [class*="major"] input',
    'education.0.startDate': '[class*="edu"] [class*="start"] input, [class*="edu"] [class*="date"]:first-of-type input',
    'education.0.endDate': '[class*="edu"] [class*="end"] input, [class*="edu"] [class*="date"]:last-of-type input',

    // 工作经历
    'workExperience.0.company': '[class*="work"] [class*="company"] input',
    'workExperience.0.title': '[class*="work"] [class*="position"] input, [class*="work"] [class*="title"] input',
    'workExperience.0.startDate': '[class*="work"] [class*="start"] input',
    'workExperience.0.endDate': '[class*="work"] [class*="end"] input',
    'workExperience.0.description': '[class*="work"] [class*="desc"] textarea, [class*="work"] [class*="content"] textarea',

    // 自我评价
    'additionalInfo.selfIntro': '[class*="self"] textarea, [class*="intro"] textarea, [class*="advantage"] textarea',
  };

  getFormContainer(): HTMLElement | null {
    return (
      document.querySelector('.resume-form-container') ||
      document.querySelector('[class*="resume"] [class*="form"]') ||
      document.querySelector('[class*="resume-form"]') ||
      document.body
    );
  }

  async beforeFill(): Promise<void> {
    // BOSS直聘: 展开所有折叠区域
    const collapsedSections = document.querySelectorAll(
      '[class*="collapse"]:not([class*="active"]), [class*="section"] [class*="expand"]:not([class*="expand"])'
    );
    for (const section of collapsedSections) {
      (section as HTMLElement).click();
      await this.sleep(300);
    }
  }
}
