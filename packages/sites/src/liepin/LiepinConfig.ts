// ===== packages/sites/src/liepin/LiepinConfig.ts =====
/**
 * 猎聘 站点配置
 *
 * 技术栈: React + Ant Design
 * 简历页面: https://c.liepin.com/resume
 */

import { BaseSiteConfig } from '../base/BaseSiteConfig.js';

export class LiepinConfig extends BaseSiteConfig {
  readonly name = '猎聘';
  readonly domain = 'liepin.com';
  readonly framework = 'react' as const;
  readonly uiLibrary = 'ant-design';

  readonly urlPatterns = [
    /^https:\/\/c\.liepin\.com\/resume/,
    /^https:\/\/v\.liepin\.com\/resume/,
    /^https:\/\/www\.liepin\.com\/resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息
    'basicInfo.name': '.ant-form-item [class*="name"] .ant-input, [class*="user-name"] .ant-input',
    'basicInfo.gender': '[class*="gender"] .ant-radio-group, [class*="sex"] .ant-radio-group',
    'basicInfo.birthDate': '[class*="birth"] .ant-picker, [class*="birthday"] .ant-picker',
    'basicInfo.phone': '[class*="phone"] .ant-input, [class*="mobile"] .ant-input',
    'basicInfo.email': '[class*="email"] .ant-input, [class*="mail"] .ant-input',
    'basicInfo.currentCity': '[class*="city"] .ant-cascader, [class*="location"] .ant-cascader',
    'basicInfo.avatar': '[class*="avatar"] .ant-upload input[type="file"]',

    // 求职意向
    'jobPreference.jobTitle': '[class*="expect"] [class*="position"] .ant-input',
    'jobPreference.expectedCities': '[class*="expect"] [class*="city"] .ant-cascader',
    'jobPreference.expectedSalary': '[class*="expect"] [class*="salary"] .ant-input-number',
    'jobPreference.jobType': '[class*="job-type"] .ant-select',
    'jobPreference.jobStatus': '[class*="status"] .ant-select',

    // 教育经历
    'education.0.school': '[class*="edu"] [class*="school"] .ant-input',
    'education.0.degree': '[class*="edu"] [class*="degree"] .ant-select',
    'education.0.major': '[class*="edu"] [class*="major"] .ant-input',
    'education.0.startDate': '[class*="edu"] [class*="start"] .ant-picker',
    'education.0.endDate': '[class*="edu"] [class*="end"] .ant-picker',

    // 工作经历
    'workExperience.0.company': '[class*="work"] [class*="company"] .ant-input',
    'workExperience.0.title': '[class*="work"] [class*="position"] .ant-input',
    'workExperience.0.startDate': '[class*="work"] [class*="start"] .ant-picker',
    'workExperience.0.endDate': '[class*="work"] [class*="end"] .ant-picker',
    'workExperience.0.description': '[class*="work"] [class*="desc"] textarea.ant-input',

    // 自我评价
    'additionalInfo.selfIntro': '[class*="self"] textarea.ant-input, [class*="intro"] textarea.ant-input',
  };

  getFormContainer(): HTMLElement | null {
    return (
      document.querySelector('.ant-form') ||
      document.querySelector('[class*="resume-form"]') ||
      document.body
    );
  }
}
