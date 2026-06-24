// ===== auto-form-filler shared/constants/field-labels.ts =====
// 字段标签词典 - 用于语义匹配

/** 简历字段 → 常见标签文本映射 */
export const FIELD_LABEL_DICTIONARY: Record<string, string[]> = {
  // 基本信息
  'basicInfo.name': ['姓名', '名字', '您的姓名', 'name', 'fullname', '真实姓名', '中文姓名', '联系人', '联系人姓名'],
  'basicInfo.gender': ['性别', 'gender', 'sex'],
  'basicInfo.birthDate': ['出生日期', '生日', '出生年月', 'birthday', 'date of birth', '出生年月日', '出生'],
  'basicInfo.phone': ['手机号', '手机号码', '电话', '联系电话', '联系方式', 'phone', 'mobile', 'tel', '电话号码', '联系手机', '手机'],
  'basicInfo.email': ['邮箱', '电子邮件', '电子邮箱', 'email', 'e-mail', 'mail', '联系邮箱', '邮箱地址'],
  'basicInfo.wechat': ['微信', '微信号', 'wechat', '微信账号'],
  'basicInfo.qq': ['QQ', 'QQ号', 'qq number'],
  'basicInfo.currentCity': ['所在城市', '现居城市', '城市', 'city', '所在地区', '现居住地', '工作城市', '现居', '居住地'],
  'basicInfo.address': ['详细地址', '地址', 'address', '通讯地址', '联系地址', '现居住地址', '居住地址'],
  'basicInfo.hometown': ['籍贯', '家乡', 'hometown', '出生地'],
  'basicInfo.idCard': ['身份证号', '身份证', 'id card', '证件号码', '身份证号码'],
  'basicInfo.maritalStatus': ['婚姻状况', '婚姻', 'marital status', '婚否'],
  'basicInfo.politicalStatus': ['政治面貌', '政治', 'political'],
  'basicInfo.ethnicity': ['民族', 'ethnicity', '民族成分'],
  'basicInfo.height': ['身高', 'height'],
  'basicInfo.weight': ['体重', 'weight'],

  // 求职意向
  'jobPreference.jobTitle': ['期望职位', '求职意向', '职位名称', 'job title', 'position', '应聘职位', '意向职位', '期望岗位', '期望从事职位'],
  'jobPreference.expectedCities': ['期望城市', '期望工作城市', '期望工作地', '工作城市', '意向城市'],
  'jobPreference.expectedSalary': ['期望薪资', '期望月薪', '薪资要求', 'expected salary', '薪资期望', '期望薪酬', '期望待遇'],
  'jobPreference.jobType': ['工作性质', 'job type', '工作类型', '求职类型'],
  'jobPreference.jobStatus': ['求职状态', '目前状态', 'job status', '在职状态', '工作状态', '当前状态'],
  'jobPreference.availableDate': ['到岗时间', '可到岗时间', 'available date', '入职时间', '可入职时间'],
  'jobPreference.industry': ['期望行业', '行业', 'industry', '意向行业'],

  // 教育经历
  'education.school': ['毕业院校', '学校', 'school', 'university', 'college', '院校名称', '学校名称', '就读学校'],
  'education.degree': ['学历', '最高学历', 'education', 'degree', '教育程度', '文化程度', '学历层次'],
  'education.major': ['专业', 'major', '所学专业', '专业名称', '主修专业'],
  'education.startDate': ['入学时间', '就读时间', '入学年月', 'start date'],
  'education.endDate': ['毕业时间', '结束时间', '毕业年月', 'end date', '毕业日期'],

  // 工作经历
  'workExperience.company': ['公司名称', '公司', 'company', '企业名称', '单位名称', '工作单位'],
  'workExperience.title': ['职位', '职务', 'title', '岗位名称', '担任职位', '工作职位'],
  'workExperience.startDate': ['入职时间', '开始时间', 'start date', '就职时间'],
  'workExperience.endDate': ['离职时间', '结束时间', 'end date', '至今'],
  'workExperience.description': ['工作内容', '工作描述', 'description', '工作职责', '主要工作', '工作业绩'],
  'workExperience.department': ['所在部门', '部门', 'department'],

  // 项目经历
  'projectExperience.name': ['项目名称', '项目', 'project name'],
  'projectExperience.role': ['担任角色', '项目角色', 'role', '负责角色'],
  'projectExperience.description': ['项目描述', '项目内容', 'description', '项目介绍', '主要工作'],

  // 技能
  'skills.name': ['技能名称', '技能', 'skill', '专业技能', '掌握技能'],
  'skills.level': ['熟练程度', '掌握程度', 'level', '熟练度'],

  // 语言
  'languages.name': ['语言', '外语', 'language', '语言能力', '外语能力'],
  'languages.level': ['语言水平', '外语水平', 'language level', '语言等级'],

  // 自我评价
  'additionalInfo.selfIntro': ['自我介绍', '个人简介', '自我评价', 'self intro', 'about me', '个人优势', '自我描述', '个人介绍', '优势'],
  'additionalInfo.hobbies': ['兴趣爱好', '爱好', 'hobbies', '兴趣'],
};

/** 获取某个字段的所有标签 */
export function getFieldLabels(fieldKey: string): string[] {
  return FIELD_LABEL_DICTIONARY[fieldKey] ?? [];
}

/** 获取所有可能的字段标签（扁平化） */
export function getAllLabels(): string[] {
  return Object.values(FIELD_LABEL_DICTIONARY).flat();
}
