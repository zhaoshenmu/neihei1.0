/**
 * Hello 节点插件
 * 简单的展示节点，显示问候语
 */
import React from 'react';
import type { NodeProps } from '@xyflow/react';

const HelloNode: React.FC<NodeProps> = () => {
  return (
    <div
      style={{
        padding: '8px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        textAlign: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 4, opacity: 0.6 }}>
        👋
      </div>
      <div style={{ fontWeight: 500, color: '#e0e0e0' }}>
        Hello, World!
      </div>
      <div style={{ fontSize: 11, color: '#808080', marginTop: 4 }}>
        这是一个示例节点
      </div>
    </div>
  );
};

export default HelloNode;
