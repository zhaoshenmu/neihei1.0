/**
 * SettingsPanel.tsx
 * 
 * 管理器面板 - 可拖动的悬浮窗口
 * 点击顶部工具栏的「管理器」按钮弹出
 * 
 * 设置项：
 * - Worker 执行超时时间
 * - 端口标签显示
 * - 重置为默认值
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { theme } from '@/theme/neihei-theme';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 260;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { workerTimeout, showPortLabels, updateSetting, resetToDefaults } = useSettingsStore();
  const [timeoutInput, setTimeoutInput] = useState(String(workerTimeout));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);

  // 当外部 workerTimeout 变化时同步输入框
  useEffect(() => {
    setTimeoutInput(String(workerTimeout));
  }, [workerTimeout]);

  // 初始化位置（居中）
  useEffect(() => {
    if (isOpen && !initialized.current) {
      setPosition({
        x: Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2),
        y: Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2),
      });
      initialized.current = true;
    }
    if (!isOpen) {
      initialized.current = false;
    }
  }, [isOpen]);

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.settings-panel-header')) {
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
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div
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
        zIndex: 1100,
        fontFamily: theme.fontFamily.sans,
        fontSize: 13,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* 标题栏 - 可拖拽区域 */}
      <div
        className="settings-panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          cursor: 'grab',
        }}
      >
        <span style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: 14 }}>
          ⚙ 管理器
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: 16,
            cursor: 'pointer',
            padding: '0 4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e06060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
        >
          ✕
        </button>
      </div>

      {/* 设置内容 */}
      <div style={{ padding: '16px 20px' }}>
        {/* Worker 超时 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              color: theme.colors.textSecondary,
              fontSize: 12,
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Worker 执行超时（毫秒）
          </label>
          <input
            type="number"
            value={timeoutInput}
            onChange={(e) => setTimeoutInput(e.target.value)}
            onBlur={() => {
              const val = parseInt(timeoutInput);
              if (!isNaN(val) && val > 0) {
                updateSetting('workerTimeout', val);
              } else {
                setTimeoutInput(String(workerTimeout));
              }
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: '#1a1a1a',
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 6,
              color: theme.colors.textPrimary,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>
            当前值: {workerTimeout}ms = {workerTimeout / 1000}秒
          </div>
        </div>

        {/* 端口标签显示 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={showPortLabels}
              onChange={(e) => updateSetting('showPortLabels', e.target.checked)}
              style={{ accentColor: theme.colors.portColor }}
            />
            显示端口标签
          </label>
        </div>

        {/* 重置按钮 */}
        <button
          onClick={resetToDefaults}
          style={{
            width: '100%',
            padding: '8px 0',
            background: '#2a2a2a',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 6,
            color: theme.colors.textMuted,
            fontSize: 12,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#e06060';
            e.currentTarget.style.color = '#e06060';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.inputBorder;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          重置为默认设置
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
