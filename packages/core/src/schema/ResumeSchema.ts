// ===== packages/core/src/schema/ResumeSchema.ts =====
/**
 * 简历数据 JSON Schema
 *
 * 定义简历数据的完整结构和字段说明
 */

/**
 * 简历数据结构
 *
 * 这是整个系统的核心数据模型，所有站点配置和字段映射
 * 都基于此结构进行匹配。
 */
export interface ResumeSchema {
  /** 基本信息 */
  basicInfo: {
    /** 姓名 */
    name: string;
    /** 性别: male | female */
    gender: string;
    /** 出生日期: YYYY-MM-DD */
    birthDate: string;
    /** 手机号 */
    phone: string;
    /** 邮箱 */
    email: string;
    /** 微信号 */
    wechat?: string;
    /** QQ号 */
    qq?: string;
    /** 所在城市 */
    currentCity: string;
    /** 详细地址 */
    address?: string;
    /** 籍贯 */
    hometown?: string;
    /** 身份证号 */
    idCard?: string;
    /** 婚姻状况 */
    maritalStatus?: string;
    /** 政治面貌 */
    politicalStatus?: string;
    /** 民族 */
    ethnicity?: string;
    /** 身高(cm) */
    height?: number;
    /** 体重(kg) */
    weight?: number;
    /** 头像 URL */
    avatar?: string;
  };

  /** 求职意向 */
  jobPreference: {
    /** 期望职位 */
    jobTitle: string;
    /** 期望城市 */
    expectedCities: string[];
    /** 期望薪资 */
    expectedSalary: string;
    /** 工作类型: fulltime | parttime | intern | remote */
    jobType: string;
    /** 求职状态 */
    jobStatus?: string;
    /** 到岗时间 */
    availableDate?: string;
    /** 期望行业 */
    industry?: string;
  };

  /** 教育经历 */
  education: Array<{
    /** 学校名称 */
    school: string;
    /** 学历: doctor | master | bachelor | associate | highschool */
    degree: string;
    /** 专业 */
    major: string;
    /** 入学时间 */
    startDate: string;
    /** 毕业时间 */
    endDate: string;
    /** 在校描述 */
    description?: string;
  }>;

  /** 工作经历 */
  workExperience: Array<{
    /** 公司名称 */
    company: string;
    /** 职位 */
    title: string;
    /** 入职时间 */
    startDate: string;
    /** 离职时间 (至今则填 'present') */
    endDate: string;
    /** 工作描述 */
    description: string;
    /** 所在部门 */
    department?: string;
  }>;

  /** 项目经历 */
  projectExperience: Array<{
    /** 项目名称 */
    name: string;
    /** 担任角色 */
    role: string;
    /** 项目描述 */
    description: string;
    /** 项目链接 */
    url?: string;
  }>;

  /** 技能标签 */
  skills: Array<{
    /** 技能名称 */
    name: string;
    /** 熟练程度: beginner | intermediate | advanced | expert */
    level: string;
  }>;

  /** 语言能力 */
  languages?: Array<{
    /** 语言名称 */
    name: string;
    /** 语言水平 */
    level: string;
  }>;

  /** 证书资质 */
  certificates?: Array<{
    /** 证书名称 */
    name: string;
    /** 获取时间 */
    date?: string;
  }>;

  /** 其他信息 */
  additionalInfo: {
    /** 自我评价 / 个人介绍 */
    selfIntro?: string;
    /** 兴趣爱好 */
    hobbies?: string;
    /** 自定义扩展字段 */
    customFields?: Record<string, unknown>;
  };
}
