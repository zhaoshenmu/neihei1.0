/**
 * 节点端口组件 - ComfyUI 风格
 * 圆角方块节点上的输入/输出连接点
 * 淡蓝灰色小圆点
 * 
 * 注意：标签由 NodeWrapper 统一渲染，此组件只渲染圆点 Handle
 */
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { theme } from '@/theme/neihei-theme';

interface NodePortProps {
  type: 'source' | 'target';
  position: Position;
  id?: string;
  style?: React.CSSProperties;
  isConnectable?: boolean;
}

const portBaseStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: theme.colors.portColor,
  border: `2px solid ${theme.colors.nodeBg}`,
  borderRadius: theme.borderRadius.port,
  boxShadow: `0 1px 3px rgba(0,0,0,0.3)`,
  cursor: 'crosshair',
};

export const NodePort: React.FC<NodePortProps> = memo(({
  type,
  position,
  id,
  style,
  isConnectable = true,
}) => {
  return (
    <Handle
      type={type === 'source' ? 'source' : 'target'}
      position={position}
      id={id}
      isConnectable={isConnectable}
      style={{
        ...portBaseStyle,
        ...style,
      }}
      className="neihei-port"
    />
  );
});

NodePort.displayName = 'NodePort';
