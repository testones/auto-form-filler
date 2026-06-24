// ===== packages/core/src/schema/FieldMapping.ts =====
// 字段映射配置 - 简历字段路径到站点选择器的映射工具

import type { ResumeData } from '@auto-form-filler/shared/types';

/**
 * 简历数据扁平化工具
 * 将嵌套的 ResumeData 转换为扁平的 key-value 对
 */
export function flattenResumeData(data: ResumeData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // 基本信息
  for (const [key, value] of Object.entries(data.basicInfo)) {
    result[`basicInfo.${key}`] = value;
  }

  // 求职意向
  for (const [key, value] of Object.entries(data.jobPreference)) {
    result[`jobPreference.${key}`] = value;
  }

  // 教育经历
  data.education.forEach((edu, i) => {
    for (const [key, value] of Object.entries(edu)) {
      result[`education.${i}.${key}`] = value;
    }
  });

  // 工作经历
  data.workExperience.forEach((work, i) => {
    for (const [key, value] of Object.entries(work)) {
      result[`workExperience.${i}.${key}`] = value;
    }
  });

  // 项目经历
  data.projectExperience.forEach((proj, i) => {
    for (const [key, value] of Object.entries(proj)) {
      result[`projectExperience.${i}.${key}`] = value;
    }
  });

  // 技能
  data.skills.forEach((skill, i) => {
    result[`skills.${i}.name`] = skill.name;
    result[`skills.${i}.level`] = skill.level;
  });

  // 其他
  for (const [key, value] of Object.entries(data.additionalInfo)) {
    if (key !== 'customFields') {
      result[`additionalInfo.${key}`] = value;
    }
  }

  return result;
}

/**
 * 值转换器 - 将简历数据值转换为表单需要的格式
 */
export const VALUE_TRANSFORMS: Record<string, (value: unknown) => unknown> = {
  /** 性别映射 */
  gender: (val: unknown) => {
    const map: Record<string, string> = {
      male: '男', female: '女',
    };
    return map[String(val)] || val;
  },

  /** 学历映射 */
  degree: (val: unknown) => {
    const map: Record<string, string> = {
      doctor: '博士', master: '硕士', bachelor: '本科',
      associate: '大专', highschool: '高中', other: '其他',
    };
    return map[String(val)] || val;
  },

  /** 工作类型映射 */
  jobType: (val: unknown) => {
    const map: Record<string, string> = {
      fulltime: '全职', parttime: '兼职', intern: '实习', remote: '远程',
    };
    return map[String(val)] || val;
  },

  /** 薪资格式化 */
  salary: (val: unknown) => {
    if (typeof val === 'object' && val !== null) {
      const s = val as { min: number; max: number; type: string };
      return s.type === 'monthly'
        ? `${s.min / 1000}k-${s.max / 1000}k`
        : `${s.min / 10000}万-${s.max / 10000}万`;
    }
    return val;
  },
};
