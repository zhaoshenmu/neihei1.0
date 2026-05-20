/**
 * NodeIdTable.tsx
 * 节点 ID 管理表格
 * 显示画布上所有节点的 ID、名称、类型
 * 点击可定位到对应节点
 */
import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { theme } from '@/theme/neihei-theme';

interface NodeIdTableProps {
  onClose: () => void;
  onLocateNode?: (nodeId: string) => void;
}

export default function NodeIdTable({ onClose, onLocateNode }: NodeIdTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useCanvasStore((s) => s.nodes);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Escape 关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (nodes.length === 0) {
    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#0d0d0d',
          border: `1px solid ${theme.colors.inputBorder}`,
          borderRadius: 10,
          padding: '24px 32px',
          zIndex: 9999,
          minWidth: 300,
          textAlign: 'center',
        }}
      >
        <div style={{ color: theme.colors.textMuted, fontSize: 14 }}>
          画布上暂无节点
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: theme.colors.inputBorder,
            color: theme.colors.textPrimary,
            border: 'none',
            borderRadius: 6,
            padding: '6px 20px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          关闭
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#0d0d0d',
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 9999,
        minWidth: 420,
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        <span style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 600 }}>
          节点列表
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 8px',
            borderRadius: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          ✕
        </button>
      </div>

      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          padding: '8px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          fontSize: 11,
          color: theme.colors.textMuted,
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        <div style={{ width: 80, flexShrink: 0 }}>节点ID</div>
        <div style={{ flex: 1 }}>节点名称</div>
        <div style={{ width: 100, flexShrink: 0 }}>类型</div>
      </div>

      {/* 节点列表 */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {nodes.map((node) => {
          const nodeType = node.type || '';
          const manifest = pluginRegistry.getManifest(nodeType);
          const nodeName = manifest?.label || nodeType;
          return (
            <div
              key={node.id}
              onClick={() => {
                onLocateNode?.(node.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                cursor: 'pointer',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  width: 80,
                  flexShrink: 0,
                  color: theme.colors.textPrimary,
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              >
                {node.id}
              </div>
              <div
                style={{
                  flex: 1,
                  color: theme.colors.textPrimary,
                  fontSize: 13,
                }}
              >
                {nodeName}
              </div>
              <div
                style={{
                  width: 100,
                  flexShrink: 0,
                  color: theme.colors.textMuted,
                  fontSize: 12,
                }}
              >
                {nodeType}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部统计 */}
      <div
        style={{
          padding: '10px 20px',
          borderTop: `1px solid ${theme.colors.inputBorder}`,
          color: theme.colors.textMuted,
          fontSize: 11,
          textAlign: 'right',
        }}
      >
        共 {nodes.length} 个节点
      </div>
    </div>
  );
};
