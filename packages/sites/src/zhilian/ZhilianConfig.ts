// ===== packages/sites/src/zhilian/ZhilianConfig.ts =====
/**
 * 智联招聘 站点配置
 *
 * 技术栈: Vue + Element UI
 * 简历页面: https://i.zhaopin.com/resume
 */

import { BaseSiteConfig } from '../base/BaseSiteConfig.js';

export class ZhilianConfig extends BaseSiteConfig {
  readonly name = '智联招聘';
  readonly domain = 'zhaopin.com';
  readonly framework = 'vue' as const;
  readonly uiLibrary = 'element-ui';

  readonly urlPatterns = [
    /^https:\/\/i\.zhaopin\.com\/resume/,
    /^https:\/\/rd5\.zhaopin\.com\/resume/,
    /^https:\/\/www\.zhaopin\.com\/resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息
    'basicInfo.name': '.resume-name .el-input__inner, [class*="name"] .el-input__inner',
    'basicInfo.gender': '[class*="gender"] .el-radio-group, [class*="sex"] .el-radio-group',
    'basicInfo.birthDate': '[class*="birth"] .el-input__inner, [class*="birthday"] .el-date-editor',
    'basicInfo.phone': '[class*="phone"] .el-input__inner, [class*="mobile"] .el-input__inner',
    'basicInfo.email': '[class*="email"] .el-input__inner, [class*="mail"] .el-input__inner',
    'basicInfo.currentCity': '[class*="city"] .el-cascader, [class*="location"] .el-cascader',
    'basicInfo.avatar': '[class*="avatar"] .el-upload input[type="file"]',

    // 求职意向
    'jobPreference.jobTitle': '[class*="expect"] [class*="position"] .el-input__inner',
    'jobPreference.expectedCities': '[class*="expect"] [class*="city"] .el-cascader',
    'jobPreference.expectedSalary': '[class*="expect"] [class*="salary"] .el-input__inner',
    'jobPreference.jobType': '[class*="job-type"] .el-select, [class*="job"] [class*="nature"] .el-select',
    'jobPreference.jobStatus': '[class*="status"] .el-select',

    // 教育经历
    'education.0.school': '[class*="edu"] [class*="school"] .el-input__inner',
    'education.0.degree': '[class*="edu"] [class*="degree"] .el-select',
    'education.0.major': '[class*="edu"] [class*="major"] .el-input__inner',
    'education.0.startDate': '[class*="edu"] [class*="start"] .el-date-editor',
    'education.0.endDate': '[class*="edu"] [class*="end"] .el-date-editor',

    // 工作经历
    'workExperience.0.company': '[class*="work"] [class*="company"] .el-input__inner',
    'workExperience.0.title': '[class*="work"] [class*="position"] .el-input__inner',
    'workExperience.0.startDate': '[class*="work"] [class*="start"] .el-date-editor',
    'workExperience.0.endDate': '[class*="work"] [class*="end"] .el-date-editor',
    'workExperience.0.description': '[class*="work"] [class*="desc"] .el-textarea__inner',

    // 自我评价
    'additionalInfo.selfIntro': '[class*="self"] .el-textarea__inner, [class*="intro"] .el-textarea__inner',
  };

  getFormContainer(): HTMLElement | null {
    return (
      document.querySelector('.resume-form') ||
      document.querySelector('.el-form') ||
      document.body
    );
  }
}
