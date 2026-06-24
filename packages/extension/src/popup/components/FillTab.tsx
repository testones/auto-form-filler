import React from 'react';
import { useResumeStore } from '../stores/resume.js';

export function FillTab() {
  const {
    siteInfo,
    siteLoading,
    isFilling,
    fillProgress,
    fillResult,
    fillForm,
    resetFillState,
  } = useResumeStore();

  const isSupported = siteInfo && siteInfo.name !== '不支持';

  return (
    <div>
      {/* 站点状态 */}
      <div className="site-status">
        <div className={`dot ${siteLoading ? 'loading' : isSupported ? 'supported' : 'unsupported'}`} />
        <div className="site-info">
          {siteLoading ? (
            <div className="name">检测中...</div>
          ) : (
            <>
              <div className="name">{siteInfo?.name || '未知站点'}</div>
              <div className="framework">
                {siteInfo?.framework} / {siteInfo?.uiLibrary}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 填充按钮 */}
      <button
        className="btn-fill"
        disabled={!isSupported || isFilling}
        onClick={fillForm}
        style={{ marginTop: 12 }}
      >
        {isFilling ? '正在填充...' : '一键填充简历'}
      </button>

      {/* 进度条 */}
      {isFilling && fillProgress && (
        <div>
          <div className="progress-text">
            {fillProgress.current} / {fillProgress.total} — {fillProgress.currentField} [{fillProgress.status}]
          </div>
          <div className="progress-bar">
            <div
              className="fill"
              style={{ width: `${(fillProgress.current / fillProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 填充结果 */}
      {fillResult && (
        <div className={`report ${fillResult.success ? 'success' : 'error'}`}>
          <div className="report-title">
            {fillResult.success ? '✅ 填充完成' : '❌ 填充失败'}
          </div>
          {fillResult.success && fillResult.report ? (
            <div className="report-stats">
              <div className="report-stat success">
                <div className="num">{fillResult.report.filledCount}</div>
                <div className="label">成功</div>
              </div>
              <div className="report-stat skipped">
                <div className="num">{fillResult.report.skippedCount}</div>
                <div className="label">跳过</div>
              </div>
              <div className="report-stat failed">
                <div className="num">{fillResult.report.failedCount}</div>
                <div className="label">失败</div>
              </div>
              <div className="report-stat">
                <div className="num">{(fillResult.report.totalDuration / 1000).toFixed(1)}s</div>
                <div className="label">耗时</div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>{fillResult.error}</div>
          )}
          <button
            onClick={resetFillState}
            style={{
              marginTop: 8, width: '100%', padding: 6, border: '1px solid #d9d9d9',
              background: 'white', borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}
          >
            清除结果
          </button>
        </div>
      )}

      {/* 提示 */}
      {!isSupported && !siteLoading && (
        <div style={{
          marginTop: 12, padding: 10, background: '#fffbe6',
          border: '1px solid #ffe58f', borderRadius: 6, fontSize: 12, color: '#ad6800',
        }}>
          ⚠️ 当前页面不在支持的招聘网站列表中。<br />
          请前往 BOSS直聘、智联招聘、猎聘、前程无忧或拉勾网的简历编辑页面。
        </div>
      )}
    </div>
  );
}
