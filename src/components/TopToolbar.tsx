/**
 * TopToolbar.tsx
 *
 * 顶部标题栏 - 全宽横条，ComfyUI 风格
 * 固定在画布顶部，与画布有分隔线
 *
 * 按钮布局（从左到右）：
 * [▶ 运行] [提示词广场] [管理器] [新建] [书架]
 *
 * 运行按钮逻辑：
 * - idle（灰色）：可点击，点击后变 running
 * - running（绿色）：运行中，不可点击，等待流程完成
 * - 由 App 层通过 onRunStateChange 控制恢复 idle
 *
 * 书架按钮逻辑：
 * - 点击弹出下拉菜单：「打开书架」「保存此书」
 * - 「打开书架」打开 BookshelfPanel 模态框
 */
import React, { useState } from 'react';
import { theme } from '@/theme/neihei-theme';
import SettingsPanel from './SettingsPanel';
import NodeIdTable from './NodeIdTable';
import PromptSquare from './PromptSquare';
import BookshelfPanel from './BookshelfPanel';
import { useAppStore } from '@/store/app-store';
import { useUndoStore } from '@/store/undo-store';
import { useBookshelfStore } from '@/store/bookshelf-store';

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
  /** 运行状态（由父组件控制，用于流程完成后恢复灰色） */
  runState?: 'idle' | 'running';
  /** 运行状态变化回调 */
  onRunStateChange?: (state: 'idle' | 'running') => void;
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

/** 书架弹出菜单项样式 */
const menuItemStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  color: '#e0e0e0',
  cursor: 'pointer',
  transition: 'background 150ms ease',
  fontFamily: theme.fontFamily.sans,
  whiteSpace: 'nowrap',
};

export default function TopToolbar({ onRun, extraActions, runState: externalRunState, onRunStateChange }: TopToolbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [internalRunState, setInternalRunState] = useState<'idle' | 'running'>('idle');
  const resetAll = useAppStore((s) => s.resetAll);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [nodeListOpen, setNodeListOpen] = useState(false);
  const [promptSquareOpen, setPromptSquareOpen] = useState(false);
  const [bookshelfMenuOpen, setBookshelfMenuOpen] = useState(false);
  const [bookshelfOpen, setBookshelfOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveBookName, setSaveBookName] = useState('');
  const [updateToastOpen, setUpdateToastOpen] = useState(false);
  const [updateToastMessage, setUpdateToastMessage] = useState('');
  const saveBook = useBookshelfStore((s) => s.saveBook);
  const canUndo = useUndoStore((s) => s.canUndo);
  const canRedo = useUndoStore((s) => s.canRedo);

  // 使用外部状态（如果提供），否则用内部状态
  const runState = externalRunState || internalRunState;

  const handleRun = () => {
    if (runState === 'running') return;
    // 如果没有外部状态控制，用内部状态
    if (!externalRunState) {
      setInternalRunState('running');
    }
    onRunStateChange?.('running');
    onRun?.();
  };

  /** 供父组件调用的完成方法（通过 ref 或 props 回调） */
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
        {/* 🔄 撤销 */}
        <button
          onClick={() => useUndoStore.getState().undo()}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          style={{
            ...btnBase,
            opacity: canUndo ? 1 : 0.3,
            cursor: canUndo ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (canUndo) e.currentTarget.style.color = '#e0e0e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b0b0b0';
          }}
        >
          ↩ 撤销
        </button>

        {/* 🔄 重做 */}
        <button
          onClick={() => useUndoStore.getState().redo()}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
          style={{
            ...btnBase,
            opacity: canRedo ? 1 : 0.3,
            cursor: canRedo ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (canRedo) e.currentTarget.style.color = '#e0e0e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#b0b0b0';
          }}
        >
          ↪ 重做
        </button>

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

        {/* 书架 - 带弹出菜单 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setBookshelfMenuOpen(!bookshelfMenuOpen)}
            style={{
              ...btnBase,
              color: bookshelfMenuOpen ? '#e0e0e0' : '#b0b0b0',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
            onMouseLeave={(e) => {
              if (!bookshelfMenuOpen) e.currentTarget.style.color = '#b0b0b0';
            }}
          >
            书架
          </button>

          {/* 书架弹出菜单 */}
          {bookshelfMenuOpen && (
            <>
              {/* 遮罩层 - 点击关闭菜单 */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1999,
                }}
                onClick={() => setBookshelfMenuOpen(false)}
              />
              {/* 菜单 */}
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#0d0d0d',
                  border: '1px solid #1e1e1e',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  zIndex: 2000,
                  minWidth: 140,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => {
                    setBookshelfMenuOpen(false);
                    setBookshelfOpen(true);
                  }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  打开书架
                </div>
                <div
                  onClick={() => {
                    setBookshelfMenuOpen(false);
                    setSaveBookName(`作品_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`);
                    setSaveDialogOpen(true);
                  }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  保存此书
                </div>
                <div
                  onClick={() => {
                    setBookshelfMenuOpen(false);
                    const store = useBookshelfStore.getState();
                    const selectedId = store.selectedBookId;
                    if (!selectedId) {
                      setUpdateToastMessage('请先在书架中选中一本书');
                      setUpdateToastOpen(true);
                      return;
                    }
                    const book = store.books.find(b => b.id === selectedId);
                    if (!book) {
                      setUpdateToastMessage('选中的书已被删除，请重新选择');
                      setUpdateToastOpen(true);
                      return;
                    }
                    store.updateBook(selectedId);
                    setUpdateToastMessage(`已缓存：${book.name}`);
                    setUpdateToastOpen(true);
                  }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  继存此书
                </div>
              </div>
            </>
          )}
        </div>

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

      {/* 书架面板 */}
      <BookshelfPanel isOpen={bookshelfOpen} onClose={() => setBookshelfOpen(false)} />

      {/*「保存此书」命名对话框 */}
      {saveDialogOpen && (
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
            zIndex: 2100,
          }}
          onClick={() => setSaveDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: 24,
              width: 380,
            }}
          >
            <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, marginBottom: 16, fontFamily: theme.fontFamily.sans }}>
              📖 保存快照
            </div>
            <div style={{ color: '#b0b0b0', fontSize: 13, marginBottom: 12, fontFamily: theme.fontFamily.sans }}>
              为当前画布状态命名：
            </div>
            <input
              type="text"
              value={saveBookName}
              onChange={(e) => setSaveBookName(e.target.value)}
              placeholder="输入作品名称..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#e0e0e0',
                fontSize: 14,
                outline: 'none',
                fontFamily: theme.fontFamily.sans,
                boxSizing: 'border-box',
                marginBottom: 20,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6a9fb5'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#333'; }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveBookName.trim()) {
                  saveBook(saveBookName.trim());
                  setSaveDialogOpen(false);
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSaveDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #1e1e1e',
                  borderRadius: 6,
                  color: '#808080',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: theme.fontFamily.sans,
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (saveBookName.trim()) {
                    saveBook(saveBookName.trim());
                    setSaveDialogOpen(false);
                  }
                }}
                style={{
                  background: saveBookName.trim() ? '#1e1e1e' : '#111',
                  border: saveBookName.trim() ? '1px solid #4a4a4a' : '1px solid #222',
                  borderRadius: 6,
                  color: saveBookName.trim() ? '#e0e0e0' : '#555',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: saveBookName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: theme.fontFamily.sans,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 节点 ID 管理表格 */}
      {nodeListOpen && <NodeIdTable onClose={() => setNodeListOpen(false)} />}

      {/* 继存提示 Toast */}
      {updateToastOpen && (
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
            zIndex: 2200,
          }}
          onClick={() => setUpdateToastOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: '32px 48px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, fontFamily: theme.fontFamily.sans }}>
              {updateToastMessage}
            </div>
            <button
              onClick={() => setUpdateToastOpen(false)}
              style={{
                marginTop: 20,
                background: '#1e1e1e',
                border: '1px solid #4a4a4a',
                borderRadius: 6,
                color: '#e0e0e0',
                padding: '6px 24px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: theme.fontFamily.sans,
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </>
  );
};
