/**
 * TopToolbar.tsx
 *
 * 顶部标题栏 - 全宽横条，ComfyUI 风格
 * 固定在画布顶部，与画布有分隔线
 *
 * 按钮布局（从左到右）：
 * [▶ 运行] [提示词广场] [管理器] [新建] [书架]
 *
 * 设计原则：
 * - 全宽横条，底部有分隔线
 * - 按钮靠左排列
 * - 纯文字按钮（仅运行保留图标）
 */
import React, { useState } from 'react';
import { theme } from '@/theme/neihei-theme';
import SettingsPanel from './SettingsPanel';
import NodeIdTable from './NodeIdTable';
import PromptSquare from './PromptSquare';
import { useAppStore } from '@/store/useAppStore';

interface ToolbarAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}

interface TopToolbarProps {
  /** 运行按钮的回调 */
  onRun?: () => void;
  /** 额外按钮（由 App 层传入） */
  extraActions?: ToolbarAction[];
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#b0b0b0',
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color 150ms ease',
  fontFamily: theme.fontFamily.sans,
};

const TopToolbar: React.FC<TopToolbarProps> = ({ onRun, extraActions }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [runState, setRunState] = useState<'idle' | 'running'>('idle');
  const resetAll = useAppStore((s) => s.resetAll);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [nodeListOpen, setNodeListOpen] = useState(false);
  const [promptSquareOpen, setPromptSquareOpen] = useState(false);

  const handleRun = () => {
    if (runState === 'running') return;
    setRunState('running');
    onRun?.();
    setTimeout(() => setRunState('idle'), 2000);
  };

  const handleNew = () => {
    resetAll();
    setNewDialogOpen(false);
  };

  return (
    <>
      {/* 全宽标题栏 - 按钮靠左排列 */}
      <div
        style={{
          height: 40,
          background: '#0d0d0d',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 16,
          gap: 2,
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        {/* ▶ 运行（最左） */}
        <button
          onClick={handleRun}
          disabled={runState === 'running'}
          style={{
            ...btnBase,
            color: runState === 'running' ? '#81c784' : '#b0b0b0',
            fontWeight: 600,
            cursor: runState === 'running' ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (runState !== 'running') e.currentTarget.style.color = '#e0e0e0';
          }}
          onMouseLeave={(e) => {
            if (runState !== 'running') e.currentTarget.style.color = '#b0b0b0';
          }}
        >
          {runState === 'running' ? '⏳' : '▶'} 运行
        </button>

        {/* 提示词广场 */}
        <button
          onClick={() => setPromptSquareOpen(true)}
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
        >
          提示词广场
        </button>

        {/* 管理器 */}
        <button
          onClick={() => setSettingsOpen(true)}
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
        >
          管理器
        </button>

        {/* 新建 */}
        <button
          onClick={() => setNewDialogOpen(true)}
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
        >
          新建
        </button>

        {/* 书架 */}
        <button
          onClick={() => {}}
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
        >
          书架
        </button>

        {/* 外部传入的额外按钮 */}
        {extraActions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              ...btnBase,
              color: action.highlight ? '#4a9eff' : '#b0b0b0',
              opacity: action.disabled ? 0.4 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!action.disabled && !action.highlight) {
                e.currentTarget.style.color = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (!action.disabled) {
                e.currentTarget.style.color = action.highlight ? '#4a9eff' : '#b0b0b0';
              }
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/*「新建」确认对话框 */}
      {newDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setNewDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: 24,
              width: 340,
            }}
          >
            <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              新建全部
            </div>
            <div style={{ color: '#b0b0b0', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              确定要新建吗？所有未保存的进度将丢失。
              <br />
              （已保存的工作流不受影响）
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setNewDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #1e1e1e',
                  borderRadius: 6,
                  color: '#808080',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleNew}
                style={{
                  background: '#1e1e1e',
                  border: '1px solid #4a4a4a',
                  borderRadius: 6,
                  color: '#e0e0e0',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                确认新建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 可拖动的管理器面板 */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* 提示词广场浮动面板 */}
      <PromptSquare isOpen={promptSquareOpen} onClose={() => setPromptSquareOpen(false)} />

      {/* 节点 ID 管理表格 */}
      {nodeListOpen && <NodeIdTable onClose={() => setNodeListOpen(false)} />}
    </>
  );
};

export default TopToolbar;
