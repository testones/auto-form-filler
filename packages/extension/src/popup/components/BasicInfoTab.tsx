import React from 'react';
import { useResumeStore } from '../stores/resume.js';

export function BasicInfoTab() {
  const { resumeData, updateResumeField } = useResumeStore();

  if (!resumeData) return <div>加载中...</div>;
  const info = resumeData.basicInfo;

  return (
    <div>
      <div className="section">
        <div className="section-title">👤 基本信息</div>
        <div className="field-row">
          <label>姓名</label>
          <input
            value={info.name || ''}
            onChange={(e) => updateResumeField('basicInfo.name', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>性别</label>
          <select
            value={info.gender || ''}
            onChange={(e) => updateResumeField('basicInfo.gender', e.target.value)}
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div className="field-row">
          <label>出生日期</label>
          <input
            type="date"
            value={info.birthDate || ''}
            onChange={(e) => updateResumeField('basicInfo.birthDate', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>手机号</label>
          <input
            value={info.phone || ''}
            onChange={(e) => updateResumeField('basicInfo.phone', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>邮箱</label>
          <input
            value={info.email || ''}
            onChange={(e) => updateResumeField('basicInfo.email', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>所在城市</label>
          <input
            value={info.currentCity || ''}
            onChange={(e) => updateResumeField('basicInfo.currentCity', e.target.value)}
          />
        </div>
      </div>

      <div className="section">
        <div className="section-title">💼 求职意向</div>
        <div className="field-row">
          <label>期望职位</label>
          <input
            value={resumeData.jobPreference.jobTitle || ''}
            onChange={(e) => updateResumeField('jobPreference.jobTitle', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>期望薪资</label>
          <input
            value={resumeData.jobPreference.expectedSalary || ''}
            onChange={(e) => updateResumeField('jobPreference.expectedSalary', e.target.value)}
            placeholder="如: 20k-30k"
          />
        </div>
        <div className="field-row">
          <label>工作类型</label>
          <select
            value={resumeData.jobPreference.jobType || ''}
            onChange={(e) => updateResumeField('jobPreference.jobType', e.target.value)}
          >
            <option value="fulltime">全职</option>
            <option value="parttime">兼职</option>
            <option value="intern">实习</option>
            <option value="remote">远程</option>
          </select>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📝 自我评价</div>
        <div className="field-row">
          <textarea
            value={resumeData.additionalInfo.selfIntro || ''}
            onChange={(e) => updateResumeField('additionalInfo.selfIntro', e.target.value)}
            placeholder="请输入自我评价"
          />
        </div>
      </div>
    </div>
  );
}
