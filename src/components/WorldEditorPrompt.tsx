/**
 * WorldEditorPrompt.tsx
 *
 * 世界编辑器标签页中按钮点击后弹出的 600×700 提示词编辑面板
 * - 受控组件：内容和版本历史由父组件管理
 * - 点击面板外部 → 仅关闭子面板（逐层递减）
 * - 底部右下角：历史版本 + 保存为新版本（无边框灰色文字）
 */
import React, { useEffect, useRef, useState } from 'react';
import { theme } from '@/theme/neihei-theme';

export interface VersionRecord {
  id: number;
  date: Date;
  content: string;
  isActive: boolean;
}

interface WorldEditorPromptProps {
  isOpen: boolean;
  onClose: () => void;                     // 仅关闭子面板
  header: string;
  subheader: string;
  // 受控状态
  content: string;
  versions: VersionRecord[];
  nextId: number;
  onContentChange: (val: string) => void;
  onSaveVersion: (newVersion: VersionRecord) => void;
  onSwitchVersion: (versionId: number) => void;
  onDeleteVersion: (versionId: number) => void;
}

const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 700;

const WorldEditorPrompt: React.FC<WorldEditorPromptProps> = ({
  isOpen,
  onClose,
  header,
  subheader,
  content,
  versions,
  nextId,
  onContentChange,
  onSaveVersion,
  onSwitchVersion,
  onDeleteVersion,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'history'>('editor');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; versionId: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 居中定位
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2),
        y: Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2 - 20),
      });
      // 打开时回到编辑器视图
      setViewMode('editor');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 点击外部 → 仅关闭子面板（逐层递减）
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        onClose();  // 只关子面板
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 右键菜单外部点击关闭（检查目标不在菜单内才关闭）
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      // 如果点击的是菜单内部元素，不关闭
      const menuEl = document.querySelector('.wep-context-menu');
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  // 拖拽逻辑
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.wep-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - PANEL_WIDTH)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - PANEL_HEIGHT)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 保存为新版本
  const handleSave = () => {
    if (!content.trim()) return;
    const newVersion: VersionRecord = {
      id: nextId,
      date: new Date(),
      content,
      isActive: true,
    };
    onSaveVersion(newVersion);
  };

  // 切换到此版本
  const handleSwitchVersion = (versionId: number) => {
    onSwitchVersion(versionId);
    setViewMode('editor');
    setContextMenu(null);
  };

  // 删除此版本
  const handleDeleteVersion = (versionId: number) => {
    onDeleteVersion(versionId);
    setContextMenu(null);
  };

  // 处理右键
  const handleContextMenu = (e: React.MouseEvent, versionId: number) => {
    e.preventDefault();
    const version = versions.find((v) => v.id === versionId);
    if (version?.isActive) return;
    setContextMenu({ x: e.clientX, y: e.clientY, versionId });
  };

  if (!isOpen) return null;

  // 格式化日期
  const formatDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
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
        zIndex: 1300,
        fontFamily: theme.fontFamily.sans,
        fontSize: 13,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 头部区域 */}
      <div
        className="wep-header"
        style={{
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          cursor: 'grab',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {header}
          </div>
          <div
            style={{
              color: '#808080',
              fontSize: 13,
              marginTop: 4,
              lineHeight: 1.3,
            }}
          >
            {subheader}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: 16,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e06060';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.textMuted;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✕
        </button>
      </div>

      {/* 编辑器视图 */}
      {viewMode === 'editor' && (
        <>
          {/* 中部输入框 - 尽量大 */}
          <div
            style={{
              flex: 1,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="请输入内容..."
              style={{
                flex: 1,
                width: '100%',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1e1e1e',
                padding: 12,
                color: '#e0e0e0',
                resize: 'none',
                outline: 'none',
                fontSize: 13,
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 底部右下角：历史版本 + 保存为新版本 */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: `1px solid ${theme.colors.inputBorder}`,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 20,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setViewMode('history')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#808080',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: theme.fontFamily.sans,
                padding: '4px 0',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; }}
            >
              历史版本
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#808080',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: theme.fontFamily.sans,
                padding: '4px 0',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; }}
            >
              保存为新版本
            </button>
          </div>
        </>
      )}

      {/* 历史版本视图 */}
      {viewMode === 'history' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 列表标题栏 */}
          <div
            style={{
              padding: '12px 16px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${theme.colors.inputBorder}`,
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>
              版本历史
            </span>
            <button
              onClick={() => setViewMode('editor')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#808080',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: theme.fontFamily.sans,
                padding: '2px 8px',
                borderRadius: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; e.currentTarget.style.background = 'transparent'; }}
            >
              ← 返回编辑
            </button>
          </div>

          {/* 版本列表 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px 12px',
            }}
          >
            {versions.length === 0 ? (
              <div
                style={{
                  color: '#606060',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 40,
                }}
              >
                暂无版本记录
              </div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  onContextMenu={(e) => handleContextMenu(e, v.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: v.isActive ? 'rgba(106, 159, 181, 0.08)' : 'transparent',
                    border: `1px solid ${v.isActive ? 'rgba(106, 159, 181, 0.2)' : 'transparent'}`,
                    marginBottom: 4,
                    cursor: v.isActive ? 'default' : 'context-menu',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!v.isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!v.isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#808080', fontSize: 12, fontFamily: 'monospace', minWidth: 36 }}>
                      #{String(v.id).padStart(3, '0')}
                    </span>
                    <span style={{ color: '#808080', fontSize: 12 }}>
                      {formatDate(v.date)}
                    </span>
                  </div>
                  {v.isActive && (
                    <span
                      style={{
                        color: '#6a9fb5',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      使用中
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="wep-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#1a1a1a',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 1400,
            overflow: 'hidden',
            minWidth: 120,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSwitchVersion(contextMenu.versionId)}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#e0e0e0',
              fontSize: 12,
              padding: '8px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: theme.fontFamily.sans,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            切换到此版本
          </button>
          <button
            onClick={() => handleDeleteVersion(contextMenu.versionId)}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#e06060',
              fontSize: 12,
              padding: '8px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: theme.fontFamily.sans,
              borderTop: `1px solid ${theme.colors.inputBorder}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224, 96, 96, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            删除此版本
          </button>
        </div>
      )}
    </div>
  );
};

export default WorldEditorPrompt;
