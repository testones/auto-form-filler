// ===== packages/sites/src/zhilian/ZhilianConfig.ts =====
/**
 * 智联招聘 站点配置
 *
 * 技术栈: Vue + Element UI
 * 简历页面: https://i.zhaopin.com/resume
 *
 * 智联简历页特点：
 * 1. SPA 应用，路由切换后表单动态加载
 * 2. 表单可能在 iframe 中（部分版本）
 * 3. 使用 Element UI 组件库
 * 4. class 名经常带 hash 后缀，需要用属性选择器
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
    /^https:\/\/i\.zhaopin\.com\/.*resume/,
  ];

  readonly fieldSelectors: Record<string, string> = {
    // 基本信息 — 智联的 class 名带 hash，用 [class*=""] 模糊匹配
    'basicInfo.name': [
      '.el-input__inner[placeholder*="姓名"]',
      '.el-input__inner[placeholder*="名字"]',
      'input[name="name"]',
      '[class*="name"] .el-input__inner',
      '[class*="realname"] .el-input__inner',
    ].join(', '),

    'basicInfo.gender': [
      '[class*="gender"] .el-radio-group',
      '[class*="sex"] .el-radio-group',
      '.el-radio-group:has(.el-radio__label:contains("男"))',
    ].join(', '),

    'basicInfo.birthDate': [
      '[class*="birth"] .el-date-editor .el-input__inner',
      '[class*="birthday"] .el-input__inner',
      'input[name="birthday"]',
      '.el-date-editor .el-input__inner[placeholder*="出生"]',
    ].join(', '),

    'basicInfo.phone': [
      'input[name="phone"]',
      'input[name="mobile"]',
      '.el-input__inner[placeholder*="手机"]',
      '.el-input__inner[placeholder*="电话"]',
      '[class*="phone"] .el-input__inner',
      '[class*="mobile"] .el-input__inner',
    ].join(', '),

    'basicInfo.email': [
      'input[name="email"]',
      '.el-input__inner[placeholder*="邮箱"]',
      '.el-input__inner[type="email"]',
      '[class*="email"] .el-input__inner',
      '[class*="mail"] .el-input__inner',
    ].join(', '),

    'basicInfo.currentCity': [
      '[class*="city"] .el-cascader',
      '[class*="city"] .el-select',
      '[class*="location"] .el-cascader',
      '.el-cascader:has(.el-input__inner[placeholder*="城市"])',
      'input[name="city"]',
    ].join(', '),

    'basicInfo.address': [
      '.el-input__inner[placeholder*="地址"]',
      'input[name="address"]',
      '[class*="address"] .el-input__inner',
    ].join(', '),

    'basicInfo.avatar': [
      '[class*="avatar"] input[type="file"]',
      '.el-upload input[type="file"]',
    ].join(', '),

    // 求职意向
    'jobPreference.jobTitle': [
      '.el-input__inner[placeholder*="职位"]',
      '.el-input__inner[placeholder*="岗位"]',
      'input[name="jobTitle"]',
      'input[name="position"]',
      '[class*="expect"] [class*="position"] .el-input__inner',
      '[class*="intent"] [class*="job"] .el-input__inner',
    ].join(', '),

    'jobPreference.expectedCities': [
      '[class*="expect"] [class*="city"] .el-cascader',
      '[class*="expect"] [class*="city"] .el-select',
      '.el-cascader:has(.el-input__inner[placeholder*="城市"])',
    ].join(', '),

    'jobPreference.expectedSalary': [
      '.el-input__inner[placeholder*="薪资"]',
      'input[name="salary"]',
      '[class*="expect"] [class*="salary"] .el-input__inner',
      '[class*="salary"] .el-input__inner',
    ].join(', '),

    'jobPreference.jobType': [
      '[class*="job-type"] .el-select',
      '[class*="nature"] .el-select',
      '.el-select:has(.el-input__inner[placeholder*="性质"])',
      '.el-select:has(.el-input__inner[placeholder*="类型"])',
    ].join(', '),

    'jobPreference.jobStatus': [
      '[class*="status"] .el-select',
      '.el-select:has(.el-input__inner[placeholder*="状态"])',
    ].join(', '),

    // 教育经历
    'education.0.school': [
      '.el-input__inner[placeholder*="学校"]',
      '.el-input__inner[placeholder*="院校"]',
      'input[name="school"]',
      '[class*="edu"] [class*="school"] .el-input__inner',
      '[class*="education"] [class*="school"] .el-input__inner',
    ].join(', '),

    'education.0.degree': [
      '.el-select:has(.el-input__inner[placeholder*="学历"])',
      '[class*="edu"] [class*="degree"] .el-select',
      '[class*="education"] [class*="degree"] .el-select',
      'select[name="degree"]',
    ].join(', '),

    'education.0.major': [
      '.el-input__inner[placeholder*="专业"]',
      'input[name="major"]',
      '[class*="edu"] [class*="major"] .el-input__inner',
      '[class*="education"] [class*="major"] .el-input__inner',
    ].join(', '),

    'education.0.startDate': [
      '[class*="edu"] .el-date-editor',
      '[class*="education"] .el-date-editor',
      '.el-date-editor .el-input__inner[placeholder*="开始"]',
      '.el-date-editor .el-input__inner[placeholder*="入学"]',
    ].join(', '),

    'education.0.endDate': [
      '[class*="edu"] .el-date-editor:nth-of-type(2)',
      '[class*="education"] .el-date-editor:nth-of-type(2)',
      '.el-date-editor .el-input__inner[placeholder*="结束"]',
      '.el-date-editor .el-input__inner[placeholder*="毕业"]',
    ].join(', '),

    // 工作经历
    'workExperience.0.company': [
      '.el-input__inner[placeholder*="公司"]',
      '.el-input__inner[placeholder*="单位"]',
      'input[name="company"]',
      '[class*="work"] [class*="company"] .el-input__inner',
      '[class*="experience"] [class*="company"] .el-input__inner',
    ].join(', '),

    'workExperience.0.title': [
      '.el-input__inner[placeholder*="职位"]',
      '.el-input__inner[placeholder*="岗位"]',
      'input[name="title"]',
      'input[name="position"]',
      '[class*="work"] [class*="position"] .el-input__inner',
      '[class*="work"] [class*="title"] .el-input__inner',
    ].join(', '),

    'workExperience.0.startDate': [
      '[class*="work"] .el-date-editor',
      '[class*="experience"] .el-date-editor',
    ].join(', '),

    'workExperience.0.endDate': [
      '[class*="work"] .el-date-editor:nth-of-type(2)',
      '[class*="experience"] .el-date-editor:nth-of-type(2)',
    ].join(', '),

    'workExperience.0.description': [
      '.el-textarea__inner[placeholder*="工作"]',
      '.el-textarea__inner[placeholder*="内容"]',
      'textarea[name="description"]',
      '[class*="work"] .el-textarea__inner',
      '[class*="experience"] .el-textarea__inner',
    ].join(', '),

    'workExperience.0.department': [
      '.el-input__inner[placeholder*="部门"]',
      'input[name="department"]',
      '[class*="work"] [class*="department"] .el-input__inner',
    ].join(', '),

    // 自我评价
    'additionalInfo.selfIntro': [
      '.el-textarea__inner[placeholder*="自我"]',
      '.el-textarea__inner[placeholder*="介绍"]',
      '.el-textarea__inner[placeholder*="评价"]',
      'textarea[name="selfIntro"]',
      'textarea[name="self_introduction"]',
      '[class*="self"] .el-textarea__inner',
      '[class*="intro"] .el-textarea__inner',
      '[class*="evaluation"] .el-textarea__inner',
    ].join(', '),
  };

  getFormContainer(): HTMLElement | null {
    // 智联简历页的表单容器
    // 注意：不能用 [class*="resume"]，会匹配到 resume-tabs-wrapper 等非表单区域
    return (
      document.querySelector('.resume-form') ||
      document.querySelector('.resume-edit') ||
      document.querySelector('.resume-content') ||
      document.querySelector('.resume__edit') ||
      document.querySelector('[class*="resume-edit"]') ||
      document.querySelector('[class*="resumeEditor"]') ||
      document.querySelector('.el-form') ||
      document.querySelector('#app') ||
      document.body
    );
  }

  /**
   * 智联简历页默认是展示状态，需要点击"编辑"按钮才会出现表单
   * beforeFill 会尝试找到并点击编辑按钮
   */
  async beforeFill(): Promise<void> {
    // 等待页面完全加载
    await this.sleep(1000);

    // 尝试找到并点击"编辑"按钮
    const editSelectors = [
      'button:has(.el-icon-edit)',
      '.el-button:has(.el-icon-edit)',
      '[class*="edit"]:has(.el-icon-edit)',
      'a:has(.el-icon-edit)',
      'span:has(.el-icon-edit)',
      // 智联可能用文字按钮
      '.el-button--text',
      '[class*="edit-btn"]',
      '[class*="editor-btn"]',
    ];

    let clicked = false;
    for (const selector of editSelectors) {
      const editBtns = document.querySelectorAll(selector);
      for (const btn of editBtns) {
        const text = (btn as HTMLElement).textContent || '';
        if (text.includes('编辑') || text.includes('修改') || (btn as HTMLElement).querySelector('.el-icon-edit')) {
          console.log('[AutoFormFiller] 点击编辑按钮:', text.trim());
          (btn as HTMLElement).click();
          clicked = true;
          break;
        }
      }
      if (clicked) break;
    }

    // 如果没找到带文字的编辑按钮，找所有 .el-icon-edit 元素
    if (!clicked) {
      const editIcons = document.querySelectorAll('.el-icon-edit');
      if (editIcons.length > 0) {
        console.log('[AutoFormFiller] 点击编辑图标');
        (editIcons[0] as HTMLElement).click();
        clicked = true;
      }
    }

    if (clicked) {
      // 等待表单渲染
      console.log('[AutoFormFiller] 等待表单渲染...');
      await this.waitForElement('.el-form, .el-input, input, textarea, select', 8000);
      await this.sleep(500);
    } else {
      // 没找到编辑按钮，可能已经在编辑模式，直接等表单
      console.log('[AutoFormFiller] 未找到编辑按钮，尝试直接检测表单');
      await this.waitForElement('.el-form, .el-input, input, textarea, select', 3000);
    }
  }
}
