/**
 * SettingsPanel.tsx
 * 
 * 管理器面板 - 可拖动的悬浮窗口
 * 布局：左右分栏
 * - 左侧：API设置卷帘，点击展开显示对应配置表单（大模型API / 本地LM Studio / 生图预留）
 * - 右侧：留空，后续增加其他功能（软件设置等）
 */
import React, { useState, useEffect, useRef } from 'react';
import { theme } from '@/theme/neihei-theme';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import { NAV_ITEMS } from '@/components/settings/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = 800;
const PANEL_HEIGHT = 620;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);

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
        display: 'flex',
        flexDirection: 'column',
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
          flexShrink: 0,
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

      {/* 主体区域：左右分栏（各占一半） */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧 - API设置卷帘（颜色与右侧一致，竖线分隔） */}
        <div
          style={{
            width: '50%',
            borderRight: `1px solid ${theme.colors.inputBorder}`,
            background: '#0d0d0d',
            flexShrink: 0,
            overflow: 'auto',
          }}
        >
          <SettingsSidebar items={NAV_ITEMS} />
        </div>

        {/* 右侧 - 留空，后续增加其他功能 */}
        <div
          style={{
            flex: 1,
            background: '#0d0d0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.textMuted,
            fontSize: 14,
          }}
        >
          其他功能（待添加）
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
