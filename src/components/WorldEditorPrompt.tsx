/**
 * WorldEditorPrompt.tsx
 *
 * 提示词编辑面板（600×700）
 * - 上部分：变量展示区（只读），从提示词中自动提取 {{变量名}}
 * - 下部分：可编辑的提示词输入框
 * - 标签："下个界面的提示词" 提示用户
 * - 底部右下角：历史版本 + 保存为新版本
 */
import React, { useEffect, useRef, useState } from 'react';
import { theme } from '@/theme/neihei-theme';
import { clampPositionWithinCanvas } from '@/utils/canvas-bounds';
import { extractVariables } from '@/utils/prompt-template';

export interface VersionRecord {
  id: number;
  date: Date;
  content: string;
  isActive: boolean;
}

interface WorldEditorPromptProps {
  isOpen: boolean;
  onClose: () => void;
  header: string;
  subheader: string;
  content: string;
  versions: VersionRecord[];
  nextId: number;
  onContentChange: (val: string) => void;
  onSaveVersion: (newVersion: VersionRecord) => void;
  onSwitchVersion: (versionId: number) => void;
  onDeleteVersion: (versionId: number) => void;
  targetPanelLabel?: string;
  constraintValue?: string;
  onConstraintChange?: (val: string) => void;
  constraintLabel?: string;
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
  targetPanelLabel = '下一个面板',
  constraintValue = '',
  onConstraintChange,
  constraintLabel = '',
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'history'>('editor');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; versionId: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 从提示词中提取变量
  const variables = React.useMemo(() => extractVariables(content), [content]);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2),
        y: Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2 - 20),
      });
      setViewMode('editor');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        onClose();
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

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      const menuEl = document.querySelector('.wep-context-menu');
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

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
      const clamped = clampPositionWithinCanvas(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
        PANEL_WIDTH,
        PANEL_HEIGHT,
      );
      setPosition({ x: clamped.x, y: clamped.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

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

  const handleSwitchVersion = (versionId: number) => {
    onSwitchVersion(versionId);
    setViewMode('editor');
    setContextMenu(null);
  };

  const handleDeleteVersion = (versionId: number) => {
    onDeleteVersion(versionId);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, versionId: number) => {
    e.preventDefault();
    const version = versions.find((v) => v.id === versionId);
    if (version?.isActive) return;
    setContextMenu({ x: e.clientX, y: e.clientY, versionId });
  };

  if (!isOpen) return null;

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
          <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, lineHeight: 1.3 }}>
            {header}
          </div>
          <div style={{ color: '#808080', fontSize: 13, marginTop: 4, lineHeight: 1.3 }}>
            {subheader}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
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
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e06060'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; e.currentTarget.style.background = 'transparent'; }}
        >
          ✕
        </button>
      </div>

      {viewMode === 'editor' && (
        <>
          {/* 标签：下个界面的提示词 */}
          <div
            style={{
              padding: '8px 16px 4px',
              color: '#6a9fb5',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            ▸ 这个提示词将用于 → {targetPanelLabel}
          </div>

          {/* 变量展示区（只读） */}
          <div
            style={{
              padding: '4px 16px 8px',
              borderBottom: `1px solid ${theme.colors.inputBorder}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#808080', fontSize: 11 }}>可用变量</span>
              <span style={{ color: '#606060', fontSize: 10 }}>（不可修改，自动从表单数据传入）</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {variables.length === 0 ? (
                <span style={{ color: '#505050', fontSize: 11, fontStyle: 'italic' }}>无变量占位符</span>
              ) : (
                variables.map((v) => (
                  <span
                    key={v}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(106, 159, 181, 0.1)',
                      border: '1px solid rgba(106, 159, 181, 0.2)',
                      color: '#8ab4c8',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                  >
                    {'{{'}{v}{'}}'}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 中部输入框 */}
          <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="请输入提示词..."
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
            {/* 约束输入框 */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '0 2px' }}>
                <span style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  ▸ 约束条件
                </span>
                <span style={{ color: '#606060', fontSize: 10 }}>
                  {constraintLabel ? `（将自动附加到${constraintLabel}的AI调用中）` : '（将自动附加到AI调用中）'}
                </span>
              </div>
              <textarea
                value={constraintValue ?? ''}
                onChange={(e) => onConstraintChange?.(e.target.value)}
                placeholder="输入约束条件，例如：不要出现超自然力量..."
                style={{
                  width: '100%',
                  height: 72,
                  borderRadius: 10,
                  background: 'rgba(201, 168, 76, 0.04)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  padding: 10,
                  color: '#d4c080',
                  resize: 'none',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>
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

      {viewMode === 'history' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.colors.inputBorder}`, flexShrink: 0 }}>
            <span style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>版本历史</span>
            <button
              onClick={() => setViewMode('editor')}
              style={{
                background: 'transparent', border: 'none', color: '#808080', fontSize: 12,
                cursor: 'pointer', fontFamily: theme.fontFamily.sans, padding: '2px 8px', borderRadius: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; e.currentTarget.style.background = 'transparent'; }}
            >
              ← 返回编辑
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
            {versions.length === 0 ? (
              <div style={{ color: '#606060', fontSize: 13, textAlign: 'center', marginTop: 40 }}>暂无版本记录</div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  onContextMenu={(e) => handleContextMenu(e, v.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8,
                    background: v.isActive ? 'rgba(106, 159, 181, 0.08)' : 'transparent',
                    border: `1px solid ${v.isActive ? 'rgba(106, 159, 181, 0.2)' : 'transparent'}`,
                    marginBottom: 4, cursor: v.isActive ? 'default' : 'context-menu',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => { if (!v.isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { if (!v.isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#808080', fontSize: 12, fontFamily: 'monospace', minWidth: 36 }}>
                      #{String(v.id).padStart(3, '0')}
                    </span>
                    <span style={{ color: '#808080', fontSize: 12 }}>{formatDate(v.date)}</span>
                  </div>
                  {v.isActive && <span style={{ color: '#6a9fb5', fontSize: 11, fontWeight: 500 }}>使用中</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="wep-context-menu"
          style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y,
            background: '#1a1a1a', border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 1400, overflow: 'hidden', minWidth: 120,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSwitchVersion(contextMenu.versionId)}
            style={{
              display: 'block', width: '100%', background: 'transparent', border: 'none',
              color: '#e0e0e0', fontSize: 12, padding: '8px 16px', cursor: 'pointer',
              textAlign: 'left', fontFamily: theme.fontFamily.sans,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            切换到此版本
          </button>
          <button
            onClick={() => handleDeleteVersion(contextMenu.versionId)}
            style={{
              display: 'block', width: '100%', background: 'transparent', border: 'none',
              color: '#e06060', fontSize: 12, padding: '8px 16px', cursor: 'pointer',
              textAlign: 'left', fontFamily: theme.fontFamily.sans,
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
