/**
 * Outline 悬浮面板
 * 双击大纲编辑器节点时弹出
 * 画布最右侧，离上50、离下50、离右50
 * 四角圆角，宽度 400px，可通过左侧滑块拉宽到 600px
 * 顶部 5 个标签：世界观、主线、人物、卷大纲、章节锚点
 * 
 * 置顶模式：点击 📌 按钮后，点击面板外部不会关闭
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useOutlineStore } from '@/store/outline-store';
import { TABS, MIN_WIDTH, MAX_WIDTH } from './types';
import type { TabId } from './types';

const OutlinePanel: React.FC = () => {
  const panelOpen = useOutlineStore((s) => s.panelOpen);
  const closePanel = useOutlineStore((s) => s.closePanel);
  const [activeTab, setActiveTab] = useState<TabId>('world');
  const [panelWidth, setPanelWidth] = useState(MIN_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 位置：离上50、离下50、离右50
  const panelTop = 50;
  const panelBottom = 50;
  const panelRight = 50;
  const panelHeight = window.innerHeight - panelTop - panelBottom;

  // 开始拖拽调整宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - panelRight;
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 点击外部关闭（仅非置顶模式有效）
  useEffect(() => {
    if (!panelOpen) return;
    if (pinned) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelOpen, closePanel, pinned]);

  // ESC 关闭
  useEffect(() => {
    if (!panelOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: panelRight,
        top: panelTop,
        width: panelWidth,
        height: panelHeight,
        background: '#0d0d0d',
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: 12,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999,
        overflow: 'hidden',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#111111',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        <span style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: 14 }}>
          📋 大纲编辑器
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setPinned(!pinned); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: pinned ? '#6a9fb5' : theme.colors.textMuted,
              fontSize: 15,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              transition: 'color 150ms ease',
            }}
            title={pinned ? '已置顶' : '置顶面板'}
          >
            {pinned ? '📌' : '📍'}
          </button>
          <button
            onClick={closePanel}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textMuted,
              fontSize: 18,
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

      {/* 标签栏 */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          background: '#0a0a0a',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.nodeBorderSelected}` : '2px solid transparent',
              color: activeTab === tab.id ? theme.colors.textPrimary : theme.colors.textMuted,
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = theme.colors.textSecondary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = theme.colors.textMuted;
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          padding: 20,
          color: theme.colors.textMuted,
          fontSize: 13,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: theme.colors.textMuted, fontSize: 14 }}>
          内容待设计...
        </span>
      </div>

      {/* 宽度调整滑块 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          background: 'transparent',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(106, 159, 181, 0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

export default OutlinePanel;
