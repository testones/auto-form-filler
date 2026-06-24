import React from 'react';
import { useResumeStore } from '../stores/resume.js';

export function WorkTab() {
  const { resumeData, updateResumeField } = useResumeStore();

  if (!resumeData) return <div>加载中...</div>;

  const work = resumeData.workExperience[0] || {
    company: '', title: '', startDate: '', endDate: '', description: '', department: '',
  };

  const updateWork = (field: string, value: string) => {
    const newWork = { ...work, [field]: value };
    updateResumeField('workExperience', [newWork, ...resumeData.workExperience.slice(1)]);
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">💼 工作经历</div>
        <div className="field-row">
          <label>公司</label>
          <input
            value={work.company || ''}
            onChange={(e) => updateWork('company', e.target.value)}
            placeholder="如: 字节跳动"
          />
        </div>
        <div className="field-row">
          <label>职位</label>
          <input
            value={work.title || ''}
            onChange={(e) => updateWork('title', e.target.value)}
            placeholder="如: 高级前端工程师"
          />
        </div>
        <div className="field-row">
          <label>部门</label>
          <input
            value={work.department || ''}
            onChange={(e) => updateWork('department', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>入职时间</label>
          <input
            type="month"
            value={work.startDate || ''}
            onChange={(e) => updateWork('startDate', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label>离职时间</label>
          <input
            type="month"
            value={work.endDate === 'present' ? '' : work.endDate || ''}
            onChange={(e) => updateWork('endDate', e.target.value || 'present')}
            placeholder="至今留空"
          />
        </div>
        <div className="field-row">
          <label>工作描述</label>
          <textarea
            value={work.description || ''}
            onChange={(e) => updateWork('description', e.target.value)}
            placeholder="请输入工作内容描述"
          />
        </div>
      </div>

      <div className="section">
        <div className="section-title">🛠 技能标签</div>
        {(resumeData.skills || []).map((skill, i) => (
          <div key={i} className="field-row">
            <label>技能{i + 1}</label>
            <input
              value={skill.name}
              onChange={(e) => {
                const skills = [...resumeData.skills];
                skills[i] = { ...skill, name: e.target.value };
                updateResumeField('skills', skills);
              }}
              placeholder="如: JavaScript"
            />
            <select
              value={skill.level}
              onChange={(e) => {
                const skills = [...resumeData.skills];
                skills[i] = { ...skill, level: e.target.value };
                updateResumeField('skills', skills);
              }}
              style={{ width: 80, flex: 'none' }}
            >
              <option value="beginner">了解</option>
              <option value="intermediate">熟悉</option>
              <option value="advanced">熟练</option>
              <option value="expert">精通</option>
            </select>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', padding: 8 }}>
        目前支持编辑第一条工作经历，后续版本支持多条
      </div>
    </div>
  );
}
