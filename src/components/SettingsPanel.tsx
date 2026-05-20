/**
 * SettingsPanel.tsx
 * 
 * 管理器面板 - 可拖动的悬浮窗口
 * 布局：左右分栏
 * - 左侧：API设置卷帘，点击展开显示对应配置表单（大模型API / 本地LM Studio / 生图预留）
 * - 右侧：留空，后续增加其他功能（软件设置等）
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/theme/neihei-theme';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import { NAV_ITEMS } from '@/components/settings/types';
import ShortcutEditor from '@/components/ShortcutEditor';
import { useSettingsStore, type EdgeLineStyle } from '@/store/settings-store';
import { clampPositionWithinCanvas } from '@/utils/canvas-bounds';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = 800;
const PANEL_HEIGHT = 620;

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
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

  // 拖拽移动（约束到画布容器内）
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

        {/* 右侧 - 上下分栏：快捷键编辑器 + 预留面板 */}
        <div
          style={{
            flex: 1,
            background: '#0d0d0d',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 上部分 - 快捷键标签 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderBottom: `1px solid ${theme.colors.inputBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px 6px',
                fontSize: 12,
                fontWeight: 600,
                color: theme.colors.textMuted,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              快捷键
            </div>
            <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
              <ShortcutEditor />
            </div>
          </div>

          {/* 下部分 - 连线款式设置 */}
          <EdgeStylePanel />
        </div>
      </div>
    </div>
  );
};

/** 连线款式面板 - 右下角设置 */
const EdgeStylePanel: React.FC = () => {
  const edgeLineStyle = useSettingsStore((s) => s.edgeLineStyle);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const handleChange = useCallback(
    (value: EdgeLineStyle) => {
      updateSetting('edgeLineStyle', value);
    },
    [updateSetting]
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        overflow: 'hidden',
      }}
    >
      {/* 标签 */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: theme.colors.textMuted,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        连线款式
      </div>

      {/* 单选选项组 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 普线 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 6,
            background: edgeLineStyle === '普线' ? 'rgba(106, 159, 181, 0.1)' : 'transparent',
            border: `1px solid ${edgeLineStyle === '普线' ? '#6a9fb5' : '#1e1e1e'}`,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (edgeLineStyle !== '普线') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
          onMouseLeave={(e) => {
            if (edgeLineStyle !== '普线') {
              e.currentTarget.style.borderColor = '#1e1e1e';
            }
          }}
        >
          <input
            type="radio"
            name="edgeLineStyle"
            value="普线"
            checked={edgeLineStyle === '普线'}
            onChange={() => handleChange('普线')}
            style={{ accentColor: '#6a9fb5' }}
          />
          <div>
            <div
              style={{
                color: edgeLineStyle === '普线' ? '#e0e0e0' : '#b0b0b0',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              普线
            </div>
            <div
              style={{
                color: '#808080',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              当前默认的静态连线样式
            </div>
          </div>
        </label>

        {/* 流动 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 6,
            background: edgeLineStyle === '流动' ? 'rgba(106, 159, 181, 0.1)' : 'transparent',
            border: `1px solid ${edgeLineStyle === '流动' ? '#6a9fb5' : '#1e1e1e'}`,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (edgeLineStyle !== '流动') {
              e.currentTarget.style.borderColor = '#333';
            }
          }}
          onMouseLeave={(e) => {
            if (edgeLineStyle !== '流动') {
              e.currentTarget.style.borderColor = '#1e1e1e';
            }
          }}
        >
          <input
            type="radio"
            name="edgeLineStyle"
            value="流动"
            checked={edgeLineStyle === '流动'}
            onChange={() => handleChange('流动')}
            style={{ accentColor: '#6a9fb5' }}
          />
          <div>
            <div
              style={{
                color: edgeLineStyle === '流动' ? '#e0e0e0' : '#b0b0b0',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              流动
            </div>
            <div
              style={{
                color: '#808080',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              数据从输入到输出单向流动特效
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
