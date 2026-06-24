// ===== packages/extension/src/options/main.ts =====
const STORAGE_KEY = 'resume_data';
const editor = document.getElementById('json-editor') as HTMLTextAreaElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLSpanElement;

const DEFAULT_RESUME = {
  basicInfo: {
    name: '张三', gender: 'male', birthDate: '1995-06-15',
    phone: '13800138000', email: 'zhangsan@example.com', currentCity: '北京',
  },
  jobPreference: {
    jobTitle: '前端开发工程师', expectedCities: ['北京'],
    expectedSalary: '20k-30k', jobType: 'fulltime',
  },
  education: [{
    school: '北京理工大学', degree: 'bachelor', major: '计算机科学与技术',
    startDate: '2013-09', endDate: '2017-06',
  }],
  workExperience: [{
    company: '字节跳动', title: '高级前端工程师',
    startDate: '2020-07', endDate: 'present',
    description: '负责抖音 Web 端核心功能开发', department: '前端架构组',
  }],
  projectExperience: [{
    name: '抖音 Web 端重构', role: '前端负责人',
    description: '主导抖音 Web 端从 Vue2 迁移到 React18',
  }],
  skills: [
    { name: 'JavaScript', level: 'expert' },
    { name: 'TypeScript', level: 'advanced' },
    { name: 'React', level: 'advanced' },
  ],
  additionalInfo: {
    selfIntro: '5年前端开发经验，精通 React/Vue 生态。',
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
