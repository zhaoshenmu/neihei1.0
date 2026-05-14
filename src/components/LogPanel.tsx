/**
 * 日志面板组件
 * 固定在应用底部，高度 300px，显示系统运行日志和错误
 */
import React, { useRef, useEffect } from 'react';
import { useLogStore, type LogEntry } from '@/store/log-store';
import { theme } from '@/theme/neihei-theme';

const LogPanel: React.FC = () => {
  const { logs, clearLogs } = useLogStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'error': return '#e06060';
      case 'warning': return '#e6a040';
      case 'success': return '#60c060';
      case 'info': default: return theme.colors.textMuted;
    }
  };

  const getLogBg = (type: LogEntry['type']): string => {
    switch (type) {
      case 'error': return 'rgba(224, 96, 96, 0.08)';
      case 'warning': return 'rgba(230, 160, 64, 0.06)';
      default: return 'transparent';
    }
  };

  return (
    <div
      style={{
        height: 300,
        minHeight: 300,
        background: '#0d0d0d',
        borderTop: `1px solid ${theme.colors.inputBorder}`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: theme.fontFamily.mono,
        fontSize: 12,
      }}
    >
      {/* 日志工具栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          background: '#111111',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: 13 }}>
            📋 日志
          </span>
          <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>
            {logs.length} 条
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>
            🟢 运行中
          </span>
          <button
            onClick={clearLogs}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.inputBorder}`,
              color: theme.colors.textMuted,
              borderRadius: 4,
              padding: '2px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.nodeBorder;
              e.currentTarget.style.color = theme.colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.inputBorder;
              e.currentTarget.style.color = theme.colors.textMuted;
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* 日志内容 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: theme.colors.textMuted,
              fontSize: 13,
            }}
          >
            暂无日志...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                gap: 8,
                padding: '3px 16px',
                background: getLogBg(log.type),
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}
            >
              {/* 时间戳 */}
              <span
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  minWidth: 64,
                  flexShrink: 0,
                }}
              >
                {log.timestamp}
              </span>

              {/* 类型标签 */}
              <span
                style={{
                  color: getLogColor(log.type),
                  minWidth: 48,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                [{log.type.toUpperCase()}]
              </span>

              {/* 消息 */}
              <span
                style={{
                  color: getLogColor(log.type),
                  flex: 1,
                  wordBreak: 'break-all',
                }}
              >
                {log.message}
              </span>

              {/* 详情 */}
              {log.detail && (
                <span
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: 10,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={log.detail}
                >
                  {log.detail}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel;
