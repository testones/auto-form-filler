// ===== packages/extension/src/options/main.ts =====
const STORAGE_KEY = 'resume_data';
const editor = document.getElementById('json-editor') as HTMLTextAreaElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLSpanElement;

const DEFAULT_RESUME = {
  basicInfo: {
    name: '张三', gender: 'female', birthDate: '1995-05',
    phone: '13800138000', email: 'zhangsan@example.com', currentCity: '大同',
    politicalStatus: '中共党员', hometown: '山西',
    wechat: 'zhangsan123', qq: '123456789',
    ethnicity: '汉族', maritalStatus: '未婚',
    height: 175, weight: 65, address: '北京市',
  },
  jobPreference: {
    jobTitle: 'Node.js工程师', expectedCities: ['包头'],
    expectedSalary: '10000-20000', jobType: 'fulltime',
    jobStatus: '离职找工作', industry: '旅游', availableDate: '一周内',
  },
  education: [
    { school: '清华大学', degree: 'bachelor', major: '计算机科学与技术', startDate: '2013-09', endDate: '2017-07' },
    { school: '北京大学', degree: 'doctor', major: '经济学', startDate: '2022-02', endDate: '2026-05' },
  ],
  workExperience: [{
    company: '阿里巴巴', title: '软件工程师',
    startDate: '2017-07', endDate: '2022-08',
    description: '系统开发与维护', department: '技术部',
  }],
  projectExperience: [{
    name: '智能客服系统', role: '项目经理',
    description: '开发智能客服系统',
  }],
  skills: [
    { name: 'JavaScript', level: 'expert' },
    { name: 'Node.js', level: 'advanced' },
    { name: '项目管理', level: 'intermediate' },
  ],
  additionalInfo: {
    selfIntro: '工作认真负责，学习能力强，具备良好的团队合作精神。',
    hobbies: '阅读、运动',
  },
};

// 加载已保存的数据
chrome.runtime.sendMessage({ type: 'GET_RESUME_DATA' }, (response) => {
  if (response?.success && response.data) {
    editor.value = JSON.stringify(response.data, null, 2);
  } else {
    editor.value = JSON.stringify(DEFAULT_RESUME, null, 2);
  }
});

// 保存
btnSave.addEventListener('click', () => {
  try {
    const data = JSON.parse(editor.value);
    chrome.runtime.sendMessage({ type: 'SAVE_RESUME_DATA', payload: data }, (response) => {
      if (response?.success) {
        status.textContent = '✅ 保存成功';
        status.style.color = '#52c41a';
        setTimeout(() => (status.textContent = ''), 2000);
      }
    });
  } catch (e) {
    status.textContent = '❌ JSON 格式错误';
    status.style.color = '#ff4d4f';
  }
});

// 重置
btnReset.addEventListener('click', () => {
  if (confirm('确定要��置为默认数据吗？')) {
    editor.value = JSON.stringify(DEFAULT_RESUME, null, 2);
    chrome.runtime.sendMessage({ type: 'SAVE_RESUME_DATA', payload: DEFAULT_RESUME }, () => {
      status.textContent = '✅ 已重置';
      status.style.color = '#52c41a';
      setTimeout(() => (status.textContent = ''), 2000);
    });
  }
});
