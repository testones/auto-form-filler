// ===== packages/sites/src/job51/Job51Config.ts =====
/**
 * 前程无忧 站点配置
 *
 * 技术栈: Vue + 自研组件
 * 简历页面: https://ehire.51job.com/resume
 */

import { BaseSiteConfig } from '../base/BaseSiteConfig.js';

export class Job51Config extends BaseSiteConfig {
  readonly name = '前程无忧';
  readonly domain = '51job.com';
  readonly framework = 'vue' as const;
  readonly uiLibrary = 'custom';

  readonly urlPatterns = [
    /^https:\/\/ehire\.51job\.com\/resume/,
    /^https:\/\/my\.51job\.com\/resume/,
    /^https:\/\/www\.51job\.com\/resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息
    'basicInfo.name': '#name, [name="name"], [class*="name"] input',
    'basicInfo.gender': '[class*="gender"] input[type="radio"], [class*="sex"] input[type="radio"]',
    'basicInfo.birthDate': '#birthday, [name="birthday"], [class*="birth"] input',
    'basicInfo.phone': '#phone, #mobile, [name="phone"], [name="mobile"]',
    'basicInfo.email': '#email, [name="email"], [class*="email"] input',
    'basicInfo.currentCity': '#city, [name="city"], [class*="city"] select',
    'basicInfo.avatar': '#avatar, [class*="avatar"] input[type="file"]',

    // 求职意向
    'jobPreference.jobTitle': '#jobTitle, [name="jobTitle"], [class*="position"] input',
    'jobPreference.expectedCities': '#expectedCity, [class*="expect"] [class*="city"] select',
    'jobPreference.expectedSalary': '#salary, [name="salary"], [class*="salary"] input',
    'jobPreference.jobType': '#jobType, [name="jobType"], [class*="job"] select',
    'jobPreference.jobStatus': '#jobStatus, [class*="status"] select',

    // 教育经历
    'education.0.school': '#school, [name="school"], [class*="edu"] [class*="school"] input',
    'education.0.degree': '#degree, [name="degree"], [class*="edu"] select',
    'education.0.major': '#major, [name="major"], [class*="edu"] [class*="major"] input',
    'education.0.startDate': '#eduStartDate, [class*="edu"] [class*="start"] input',
    'education.0.endDate': '#eduEndDate, [class*="edu"] [class*="end"] input',

    // 工作经历
    'workExperience.0.company': '#company, [name="company"], [class*="work"] [class*="company"] input',
    'workExperience.0.title': '#title, [name="title"], [class*="work"] [class*="position"] input',
    'workExperience.0.startDate': '#workStartDate, [class*="work"] [class*="start"] input',
    'workExperience.0.endDate': '#workEndDate, [class*="work"] [class*="end"] input',
    'workExperience.0.description': '#description, [class*="work"] textarea',

    // 自我评价
    'additionalInfo.selfIntro': '#selfIntro, [name="selfIntro"], [class*="self"] textarea',
  };

  getFormContainer(): HTMLElement | null {
    return (
      document.querySelector('#resumeForm') ||
      document.querySelector('[class*="resume"] form') ||
      document.querySelector('form') ||
      document.body
    );
  }
}
