/**
 * 侧边栏可拖拽项目
 * 每个插件对应一个可拖拽到画布的侧边栏项
 */
import React from 'react';
import type { PluginManifest } from '@/plugin-system';
import { pluginRegistry } from '@/plugin-system';
import { theme } from '@/theme/neihei-theme';

interface SidebarItemProps {
  manifest: PluginManifest;
}

export default function SidebarItem({ manifest }: SidebarItemProps) {
  const shortId = pluginRegistry.getFixedId(manifest.type);
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/plugin-type', manifest.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        padding: '10px 16px',
        margin: '4px 0',
        background: theme.colors.buttonBg,
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: '50px',
        cursor: 'grab',
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.normal,
        fontFamily: theme.fontFamily.sans,
        transition: `all ${theme.transition.fast}`,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3a3a3a';
        e.currentTarget.style.background = '#111111';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.inputBorder;
        e.currentTarget.style.background = theme.colors.buttonBg;
      }}
    >
      {/* 图标占位 */}
      <span style={{ fontSize: 14, opacity: 0.7 }}>
        {manifest.icon || '⬡'}
      </span>
      
      {/* 类型 ID */}
      {shortId && (
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {shortId}
        </span>
      )}
      
      {/* 标签 */}
      <span style={{ flex: 1 }}>{manifest.label}</span>
      
      {/* 类型提示 */}
      <span
        style={{
          fontSize: 10,
          color: theme.colors.textMuted,
          background: 'rgba(0,0,0,0.3)',
          padding: '2px 8px',
          borderRadius: 10,
        }}
      >
        {manifest.category || '通用'}
      </span>
    </div>
  );
};
