/**
 * 快速连接菜单
 * 从端口拖出连线到空白处时弹出，选择目标节点类型后自动创建节点+连线
 *
 * 逻辑：
 * - 从输出口(source)拖出 → 显示有输入口的节点（亮色可点），无输入口的灰色
 * - 从输入口(target)拖出 → 显示有输出口的节点（亮色可点），无输出口的灰色
 */
import React, { useEffect, useRef } from 'react';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { theme } from '@/theme/neihei-theme';

interface QuickConnectMenuProps {
  /** 菜单位置（屏幕坐标） */
  x: number;
  y: number;
  /** 选中的节点类型回调 */
  onSelect: (type: string) => void;
  /** 关闭菜单 */
  onClose: () => void;
  /** 从哪个端口拖出：'source'=输出口 'target'=输入口 */
  fromHandleType?: 'source' | 'target' | null;
}

const QuickConnectMenu: React.FC<QuickConnectMenuProps> = ({ x, y, onSelect, onClose, fromHandleType }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // 延迟添加，避免立即触发（刚创建时鼠标还在菜单上）
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // ESC 键关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 获取所有插件清单
  const manifests = pluginRegistry.getAllManifests();

  // 根据拖出的端口类型决定：
  // - 从输出口(source)拖 → 目标节点必须有输入口
  // - 从输入口(target)拖 → 目标节点必须有输出口
  // 如果没有 fromHandleType（从画布双击弹出），全部可见
  const isConnectable = (manifest: { inputs?: any[]; outputs?: any[] }): boolean => {
    if (!fromHandleType) return true;
    if (fromHandleType === 'target') {
      // 从输入口拖 → 新节点必须有输出口
      return (manifest.outputs && manifest.outputs.length > 0) ?? false;
    }
    // 从输出口拖（默认） → 新节点必须有输入口
    return (manifest.inputs && manifest.inputs.length > 0) ?? false;
  };

  const getDisabledReason = (manifest: { inputs?: any[]; outputs?: any[] }): string | null => {
    if (!fromHandleType) return null;
    if (fromHandleType === 'target') {
      if (!manifest.outputs || manifest.outputs.length === 0) return '仅输入';
      return null;
    }
    if (!manifest.inputs || manifest.inputs.length === 0) return '仅输出';
    return null;
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        background: theme.colors.nodeBg,
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: 8,
        padding: '6px 0',
        minWidth: 180,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          padding: '6px 14px',
          fontSize: 11,
          color: theme.colors.textMuted,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          borderBottom: `1px solid ${theme.colors.nodeBorder}`,
          marginBottom: 4,
        }}
      >
        选择节点
      </div>
      {manifests.map((manifest) => {
        const connectable = isConnectable(manifest);
        const reason = getDisabledReason(manifest);

        return (
          <div
            key={manifest.type}
            onClick={() => {
              if (!connectable) return;
              onSelect(manifest.type);
            }}
            style={{
              padding: '7px 14px',
              cursor: connectable ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: connectable ? theme.colors.textPrimary : '#555',
              transition: 'background 0.1s',
              opacity: connectable ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (!connectable) return;
              e.currentTarget.style.background = theme.colors.buttonBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.6 }}>
              {manifest.icon || '⬡'}
            </span>
            <span style={{ textDecoration: connectable ? 'none' : 'line-through' }}>
              {manifest.label}
            </span>
            {manifest.category && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  color: theme.colors.textMuted,
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1px 7px',
                  borderRadius: 8,
                }}
              >
                {manifest.category}
              </span>
            )}
            {reason && (
              <span
                style={{
                  fontSize: 9,
                  color: '#666',
                  marginLeft: 2,
                }}
              >
                {reason}
              </span>
            )}
          </div>
        );
      })}
      {manifests.length === 0 && (
        <div style={{ padding: '12px 14px', color: theme.colors.textMuted, fontSize: 12 }}>
          暂无可用节点
        </div>
      )}
    </div>
  );
};

export default QuickConnectMenu;
