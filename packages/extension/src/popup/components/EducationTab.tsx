import React from 'react';
import { useResumeStore } from '../stores/resume.js';

export function EducationTab() {
  const { resumeData, updateResumeField } = useResumeStore();

  if (!resumeData) return <div>加载中...</div>;

  const edu = resumeData.education[0] || {
    school: '', degree: 'bachelor', major: '', startDate: '', endDate: '',
  };

  const updateEdu = (field: string, value: string) => {
    const newEdu = { ...edu, [field]: value };
    updateResumeField('education', [newEdu, ...resumeData.education.slice(1)]);
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">🎓 教育经历</div>
        <div className="field-row">
          <label>学校</label>
          <input
            value={edu.school || ''}
            onChange={(e) => updateEdu('school', e.target.value)}
            placeholder="如: 北京理工大学"
          />
        </div>
        <div className="field-row">
          <label>学历</label>
          <select
            value={edu.degree || 'bachelor'}
            onChange={(e) => updateEdu('degree', e.target.value)}
          >
            <option value="doctor">博士</option>
            <option value="master">硕士</option>
            <option value="bachelor">本科</option>
            <option value="associate">大专</option>
            <option value="highschool">高中</option>
          </select>
        </div>
        <div className="field-row">
          <label>专业</label>
          <input
            value={edu.major || ''}
            onChange={(e) => updateEdu('major', e.target.value)}
            placeholder="如: 计算机科学与技术"
          />
        </div>
        <div className="field-row">
          <label>入学时间</label>
          <input
            type="month"
            value={edu.startDate || ''}
            onChange={(e) => updateEdu('startDate', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>毕业时间</label>
          <input
            type="month"
            value={edu.endDate || ''}
            onChange={(e) => updateEdu('endDate', e.target.value)}
          />
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', padding: 8 }}>
        目前支持编辑第一条教育经历，后续版本支持多条
      </div>
    </div>
  );
}
