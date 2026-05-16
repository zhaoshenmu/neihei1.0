/**
 * 日志面板组件 - 悬浮窗口形式
 * 界面右下角有一个 <> 按钮，点击弹出悬浮日志窗口
 * 四角圆角，可拖动，可关闭
 */
import React, { useRef, useEffect, useState } from 'react';
import { useLogStore, type LogEntry } from '@/store/log-store';
import { theme } from '@/theme/neihei-theme';

const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 360;

const LogPanel: React.FC = () => {
  const { logs, clearLogs } = useLogStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - PANEL_WIDTH - 60, y: window.innerHeight - PANEL_HEIGHT - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // 窗口大小变化时调整位置
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - PANEL_WIDTH - 20),
        y: Math.min(prev.y, window.innerHeight - PANEL_HEIGHT - 20),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.log-panel-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - PANEL_WIDTH)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - PANEL_HEIGHT)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* 右下角 <> 按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 40,
          height: 30,
          borderRadius: 6,
          background: isOpen ? '#2a2a2a' : '#1a1a1a',
          border: `1px solid ${theme.colors.inputBorder}`,
          color: theme.colors.textMuted,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Consolas', 'Courier New', monospace",
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2a2a2a';
          e.currentTarget.style.borderColor = theme.colors.nodeBorder;
          e.currentTarget.style.color = theme.colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isOpen ? '#2a2a2a' : '#1a1a1a';
          e.currentTarget.style.borderColor = theme.colors.inputBorder;
          e.currentTarget.style.color = theme.colors.textMuted;
        }}
        title="日志面板"
      >
        {'< >'}
      </button>

      {/* 悬浮日志窗口 */}
      {isOpen && (
        <div
          ref={panelRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: PANEL_WIDTH,
            height: PANEL_HEIGHT,
            background: '#0d0d0d',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: theme.fontFamily.mono,
            fontSize: 12,
            zIndex: 999,
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'default',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {/* 日志工具栏 - 可拖拽区域 */}
          <div
            className="log-panel-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: '#111111',
              borderBottom: `1px solid ${theme.colors.inputBorder}`,
              cursor: 'grab',
              borderRadius: '12px 12px 0 0',
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                🟢 运行中
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); clearLogs(); }}
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
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.colors.textMuted,
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e06060'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
              >
                ✕
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
                    padding: '4px 16px',
                    background: getLogBg(log.type),
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}
                >
                  {/* 第一行：时间戳 + 类型标签 */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
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
                  </div>

                  {/* 第二行：消息内容（独占整行，自由换行） */}
                  <div
                    style={{
                      color: getLogColor(log.type),
                      fontSize: 12,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {log.message}
                  </div>

                  {/* 第三行：详情（如果有） */}
                  {log.detail && (
                    <div
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: 11,
                        marginTop: 2,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      └ {log.detail}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LogPanel;
