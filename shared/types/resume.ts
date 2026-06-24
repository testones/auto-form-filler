// ===== auto-form-filler shared/types/resume.ts =====
// 简历数据结构 - 核心数据模型

/** 简历完整数据结构 */
export interface ResumeData {
  basicInfo: BasicInfo;
  jobPreference: JobPreference;
  education: Education[];
  workExperience: WorkExperience[];
  projectExperience: ProjectExperience[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  socialLinks: SocialLink[];
  attachments: Attachment[];
  additionalInfo: AdditionalInfo;
}

/** 基本信息 */
export interface BasicInfo {
  name: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  phone: string;
  email: string;
  wechat?: string;
  qq?: string;
  country?: string;
  currentCity: string;
  address?: string;
  maritalStatus?: 'married' | 'unmarried' | '';
  politicalStatus?: string;
  idCard?: string;
  avatar?: string;
  hometown?: string;
  ethnicity?: string;
  height?: number;
  weight?: number;
}

/** 求职意向 */
export interface JobPreference {
  jobTitle: string;
  industry?: string[];
  expectedCities: string[];
  expectedSalary: ExpectedSalary;
  jobType: JobType;
  jobStatus: JobStatus;
  availableDate?: string;
  expectedPositions?: string[];
}

export interface ExpectedSalary {
  min: number;
  max: number;
  type: 'monthly' | 'yearly';
}

export type JobType = 'fulltime' | 'parttime' | 'intern' | 'remote' | '';
export type JobStatus = 'actively-looking' | 'open-to-opportunities' | 'not-looking' | '';

/** 教育经历 */
export interface Education {
  school: string;
  degree: EducationDegree;
  major: string;
  startDate: string;
  endDate: string;
  isHighest: boolean;
  gpa?: number;
  ranking?: string;
  description?: string;
}

export type EducationDegree = 'doctor' | 'master' | 'bachelor' | 'associate' | 'highschool' | 'other' | '';

/** 工作经历 */
export interface WorkExperience {
  company: string;
  industry?: string;
  companySize?: string;
  title: string;
  department?: string;
  startDate: string;
  endDate: string;
  description: string;
  salary?: { min: number; max: number };
  reportTo?: string;
  subordinateCount?: number;
}

/** 项目经历 */
export interface ProjectExperience {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  url?: string;
  techStack?: string[];
}

/** 技能 */
export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  years?: number;
}

/** 语言能力 */
export interface Language {
  name: string;
  level: 'native' | 'fluent' | 'intermediate' | 'basic' | '';
  certificate?: string;
  score?: string;
}

/** 证书资质 */
export interface Certification {
  name: string;
  issuer?: string;
  date: string;
}

/** 社交链接 */
export interface SocialLink {
  platform: 'github' | 'linkedin' | 'blog' | 'portfolio' | 'other';
  url: string;
}

/** 附件 */
export interface Attachment {
  name: string;
  type: 'resume' | 'portfolio' | 'certificate' | 'other';
  url?: string;
  file?: File;
}

/** 其他信息 */
export interface AdditionalInfo {
  selfIntro: string;
  hobbies?: string[];
  awards?: string[];
  publications?: string[];
  customFields?: Record<string, unknown>;
}

/** 简历字段路径联合类型 */
export type ResumeFieldPath =
  | `basicInfo.${keyof BasicInfo}`
  | `jobPreference.${keyof JobPreference}`
  | `education.${number}.${keyof Education}`
  | `workExperience.${number}.${keyof WorkExperience}`
  | `projectExperience.${number}.${keyof ProjectExperience}`
  | `skills.${number}.${keyof Skill}`
  | `languages.${number}.${keyof Language}`
  | `certifications.${number}.${keyof Certification}`
  | `socialLinks.${number}.${keyof SocialLink}`
  | `attachments.${number}.${keyof Attachment}`
  | `additionalInfo.${keyof AdditionalInfo}`
  | string;
