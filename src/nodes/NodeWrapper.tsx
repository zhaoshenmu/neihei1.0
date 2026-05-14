/**
 * 通用节点包装器 - ComfyUI 风格
 * 圆角方块结构：标题栏 + 内容区
 * 端口在节点左右两侧独立显示，每个端口一个圆点 + 标签
 * 
 * 性能优化：
 * - will-change: transform 提示 GPU 加速
 * - 移除 box-shadow transition（拖动时不需要）
 * - 使用 contain: layout style 减少重排范围
 * - 不能设置 overflow: hidden，否则 Handle 端口会被裁剪
 */
import React, { memo } from 'react';
import { Position } from '@xyflow/react';
import { NodePort } from './NodePort';
import { theme } from '@/theme/neihei-theme';

interface PortDef {
  id: string;
  label?: string;
}

interface NodeWrapperProps {
  label: string;
  children?: React.ReactNode;
  selected?: boolean;
  data?: Record<string, unknown>;
  style?: React.CSSProperties;
  inputs?: PortDef[];
  outputs?: PortDef[];
}

/**
 * ComfyUI 风格节点包装器
 * ┌─────────────────────┐
 * │ ● 标题文字          │  ← 深色标题栏
 * ├─────────────────────┤
 * │  ○ trigger          │  ← 输入端口行
 * │  ○ text             │
 * │                     │
 * │  插件内容区域        │  ← 中灰背景
 * │                     │
 * │  ● out-1            │  ← 输出端口行
 * │  ● out-2            │
 * │  ● out-3            │
 * │  ● out-4            │
 * └─────────────────────┘
 */
export const NodeWrapper: React.FC<NodeWrapperProps> = memo(({
  label,
  children,
  selected = false,
  style,
  inputs,
  outputs,
}) => {
  return (
    <div
      style={{
        background: theme.colors.nodeBg,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: selected ? theme.colors.nodeBorderSelected : theme.colors.nodeBorder,
        borderRadius: theme.borderRadius.node,
        minWidth: 200,
        // 不使用 box-shadow（拖动时触发 GPU 重绘），选中时仅加亮边框
        position: 'relative',
        fontFamily: theme.fontFamily.sans,
        // GPU 加速：提示浏览器将此元素提升为独立图层
        willChange: 'transform',
        // 限制重排范围
        contain: 'layout style',
        ...style,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          background: theme.colors.nodeHeaderBg,
          padding: theme.spacing.headerPadding,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${theme.colors.nodeBorder}`,
          userSelect: 'none',
          borderTopLeftRadius: theme.borderRadius.node,
          borderTopRightRadius: theme.borderRadius.node,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: selected ? theme.colors.nodeBorderSelected : theme.colors.portColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.fontSize.normal,
            fontWeight: 600,
            letterSpacing: '0.3px',
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>
      </div>

      {/* 输入端口列表 */}
      {inputs && inputs.length > 0 && (
        <div
          style={{
            padding: '6px 12px',
            borderBottom: children ? `1px solid ${theme.colors.nodeBorder}` : 'none',
          }}
        >
          {inputs.map((port) => (
            <div
              key={port.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '3px 0',
                position: 'relative',
              }}
            >
              <NodePort
                type="target"
                position={Position.Left}
                id={port.id}
              />
              <span
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.small,
                  marginLeft: 4,
                }}
              >
                {port.label || port.id}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 内容区 */}
      {children && (
        <div
          style={{
            padding: theme.spacing.contentPadding,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.small,
          }}
        >
          {children}
        </div>
      )}

      {/* 输出端口列表 */}
      {outputs && outputs.length > 0 && (
        <div
          style={{
            padding: '6px 12px',
            borderTop: children ? `1px solid ${theme.colors.nodeBorder}` : 'none',
          }}
        >
          {outputs.map((port) => (
            <div
              key={port.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '3px 0',
                position: 'relative',
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.small,
                  marginRight: 4,
                }}
              >
                {port.label || port.id}
              </span>
              <NodePort
                type="source"
                position={Position.Right}
                id={port.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

NodeWrapper.displayName = 'NodeWrapper';
