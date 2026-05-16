/**
 * 通用节点包装器 - ComfyUI 风格
 * 圆角方块结构：标题栏 + 内容区
 * 端口在节点左右两侧独立显示，每个端口一个圆点 + 标签
 * 
 * 职责：
 * - 统一节点外观（标题栏、端口、内容区）
 * - 根据执行状态改变边框颜色（运行蓝/成功绿/错误红）
 * - 显示错误信息在节点内部
 * - 标题栏左侧圆点反映执行状态
 * 
 * 性能优化：
 * - will-change: transform 提示 GPU 加速
 * - 移除 box-shadow transition（拖动时不需要）
 * - 使用 contain: layout style 减少重排范围
 * - 不能设置 overflow: hidden，否则 Handle 端口会被裁剪
 */
import React, { memo } from 'react';
import { Position, Handle } from '@xyflow/react';
import { NodePort } from './NodePort';
import { theme } from '@/theme/neihei-theme';
import { useExecutionStore } from '@/store/execution-store';

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
  nodeId?: string;  // 可选，用于执行状态跟踪
  collapsed?: boolean;  // 是否只显示标题栏
  shortId?: string;  // 节点短 ID，如 01、02，用于标题栏显示
}

/**
 * ComfyUI 风格节点包装器
 * ┌─────────────────────┐
 * │ ● 标题文字          │  ← 深色标题栏（圆点颜色反映状态）
 * ├─────────────────────┤
 * │  ○ trigger          │  ← 输入端口行
 * │  ○ text             │
 * │                     │
 * │  插件内容区域        │  ← 中灰背景
 * │  ❌ 错误信息        │  ← 出错时显示（红色边框 + 红色文字）
 * │                     │
 * │  ● out-1            │  ← 输出端口行
 * └─────────────────────┘
 */
export const NodeWrapper: React.FC<NodeWrapperProps> = memo(({
  label,
  children,
  selected = false,
  style,
  inputs,
  outputs,
  nodeId,
  collapsed = false,
  shortId,
}) => {
  // 获取该节点的执行状态
  const nodeState = useExecutionStore(
    (s) => nodeId ? s.states[nodeId] : undefined
  );

  // 根据执行状态决定边框颜色
  const statusBorderColor = (() => {
    if (!nodeState) return undefined;
    switch (nodeState.status) {
      case 'running': return '#4a9eff';   // 蓝色：执行中
      case 'success': return '#4caf50';   // 绿色：执行成功
      case 'error':   return '#f44336';   // 红色：执行出错
      default:        return undefined;    // idle：使用默认颜色
    }
  })();

  // 标题栏左侧圆点颜色（也反映状态）
  const dotColor = (() => {
    if (!nodeState) return selected ? theme.colors.nodeBorderSelected : theme.colors.portColor;
    switch (nodeState.status) {
      case 'running': return '#4a9eff';
      case 'success': return '#4caf50';
      case 'error':   return '#f44336';
      default:        return selected ? theme.colors.nodeBorderSelected : theme.colors.portColor;
    }
  })();

  // 计算执行耗时
  const duration = nodeState?.startedAt && nodeState?.endedAt
    ? (nodeState.endedAt - nodeState.startedAt)
    : undefined;

  // ── 收起模式：标题栏左侧隐藏输入 Handle ──
  const renderCollapsedInputHandles = () => {
    if (!inputs || inputs.length === 0) return null;
    return inputs.map((port) => (
      <Handle
        key={port.id}
        type="target"
        position={Position.Left}
        id={port.id}
        style={{
          width: 10,
          height: 10,
          background: theme.colors.portColor,
          border: `2px solid ${theme.colors.nodeBg}`,
          borderRadius: '50%',
          position: 'absolute' as const,
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'crosshair',
          zIndex: 10,
        }}
      />
    ));
  };

  // ── 收起模式：标题栏右侧隐藏输出 Handle ──
  const renderCollapsedOutputHandles = () => {
    if (!outputs || outputs.length === 0) return null;
    return outputs.map((port) => (
      <Handle
        key={port.id}
        type="source"
        position={Position.Right}
        id={port.id}
        style={{
          width: 10,
          height: 10,
          background: theme.colors.portColor,
          border: `2px solid ${theme.colors.nodeBg}`,
          borderRadius: '50%',
          position: 'absolute' as const,
          right: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'crosshair',
          zIndex: 10,
        }}
      />
    ));
  };

  return (
    <div
      style={{
        background: theme.colors.nodeBg,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: statusBorderColor || (selected ? theme.colors.nodeBorderSelected : theme.colors.nodeBorder),
        borderRadius: theme.borderRadius.node,
        minWidth: collapsed ? 120 : 200,
        minHeight: collapsed ? 36 : undefined,
        position: 'relative',
        fontFamily: theme.fontFamily.sans,
        willChange: 'transform',
        contain: 'layout style',
        ...style,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          background: theme.colors.nodeHeaderBg,
          padding: collapsed ? '6px 16px' : theme.spacing.headerPadding,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: collapsed ? 'none' : `1px solid ${theme.colors.nodeBorder}`,
          userSelect: 'none',
          borderRadius: theme.borderRadius.node,
          position: 'relative',
        }}
      >
        {/* 收起模式：左侧汇聚输入 Handle */}
        {collapsed && renderCollapsedInputHandles()}

        {/* 收起图标指示 */}
        {collapsed && (
          <span style={{ color: theme.colors.textMuted, fontSize: 11, marginRight: 2 }}>▶</span>
        )}

        {/* 状态圆点 */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            transition: 'background 0.2s ease',
          }}
        />
        <span
          style={{
            color: theme.colors.textPrimary,
            fontSize: collapsed ? 12 : theme.fontSize.normal,
            fontWeight: 600,
            letterSpacing: '0.3px',
            lineHeight: 1.3,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {label}
          {duration !== undefined && (
            <span style={{ color: theme.colors.textMuted, fontSize: 10, marginLeft: 8, fontWeight: 400 }}>
              {duration}ms
            </span>
          )}
        </span>

        {/* 节点短 ID 显示 —— 节点：01 */}
        {shortId && (
          <span
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: collapsed ? 9 : 10,
              fontWeight: 400,
              letterSpacing: '0.5px',
              marginLeft: 'auto',
              paddingLeft: 8,
              flexShrink: 0,
              userSelect: 'text' as const,
            }}
          >
            节点：{shortId}
          </span>
        )}

        {/* 错误徽章 */}
        {nodeState?.status === 'error' && nodeState.error && (
          <span
            title={nodeState.error}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#f44336',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'help',
            }}
          >
            !
          </span>
        )}

        {/* 收起模式：右侧汇聚输出 Handle */}
        {collapsed && renderCollapsedOutputHandles()}
      </div>

      {/* 非收起模式：正常显示输入端口列表 */}
      {!collapsed && inputs && inputs.length > 0 && (
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

      {/* 非收起模式：正常显示内容区 */}
      {!collapsed && children && (
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

      {/* 非收起模式：正常显示输出端口列表 */}
      {!collapsed && outputs && outputs.length > 0 && (
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
