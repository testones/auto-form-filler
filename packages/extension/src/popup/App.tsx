import React, { useEffect } from 'react';
import { useResumeStore } from './stores/resume.js';
import { FillTab } from './components/FillTab.js';
import { BasicInfoTab } from './components/BasicInfoTab.js';
import { EducationTab } from './components/EducationTab.js';
import { WorkTab } from './components/WorkTab.js';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    loadResume,
    detectSite,
  } = useResumeStore();

  useEffect(() => {
    loadResume();
    detectSite();
  }, []);

  return (
    <div className="app">
      {/* 头部 */}
      <div className="header">
        <h1>简历自动填充助手</h1>
        <span className="version">v1.0</span>
      </div>

      {/* Tab 切换 */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'fill' ? 'active' : ''}`}
          onClick={() => setActiveTab('fill')}
        >
          一键填充
        </div>
        <div
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          基本信息
        </div>
        <div
          className={`tab ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          教育经历
        </div>
        <div
          className={`tab ${activeTab === 'work' ? 'active' : ''}`}
          onClick={() => setActiveTab('work')}
        >
          工作经历
        </div>
      </div>

      {/* 内容区 */}
      <div className="content">
        {activeTab === 'fill' && <FillTab />}
        {activeTab === 'basic' && <BasicInfoTab />}
        {activeTab === 'education' && <EducationTab />}
        {activeTab === 'work' && <WorkTab />}
      </div>

      {/* 底部 */}
      <div className="footer">
        <span>支持: BOSS直聘 / 智联 / 猎聘 / 51job / 拉勾</span>
        <a
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          高级设置
        </a>
      </div>
    </div>
  );
}
