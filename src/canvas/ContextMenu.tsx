/**
 * ContextMenu.tsx
 * 
 * 通用右键菜单组件
 * 节点右键和画布空白右键共用
 * 
 * 后续功能扩展：向 items 数组添加新项即可，无需修改组件
 */
import React, { useEffect, useRef } from 'react';
import { theme } from '@/theme/neihei-theme';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;  // 在前面加分隔线
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // 延迟注册避免立即触发
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 按 Escape 关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 确保不超出视口
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        background: '#0d0d0d',
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        zIndex: 9999,
        minWidth: 160,
        padding: '4px 0',
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              style={{
                height: 1,
                background: theme.colors.inputBorder,
                margin: '4px 8px',
              }}
            />
          );
        }
        return (
          <div
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            style={{
              padding: '8px 16px',
              color: item.danger ? '#e06060' : item.disabled ? theme.colors.textMuted : theme.colors.textPrimary,
              fontSize: 13,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 100ms ease',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
};

export default ContextMenu;
