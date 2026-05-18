/**
 * 掌故司 - 记忆内核节点
 * 管理上下文记忆与历史对话存储
 * 端口：
 * - 输入：左上 trigger-in（触发），左下 data-in（数据输入）
 * - 输出：右上 trigger-out（输出），右下 data-out（数据输出）
 */
import React from 'react';
import type { NodeProps } from '@xyflow/react';

const MEMORY_ITEMS = [
  { id: 'context', label: '上下文记忆', status: 'ready' as const },
  { id: 'history', label: '对话历史', status: 'ready' as const },
  { id: 'summary', label: '摘要缓存', status: 'ready' as const },
];

const STATUS_COLORS: Record<string, string> = {
  ready: '#4a4a4a',
  active: '#4a9eff',
  loaded: '#44cc44',
};

const ZhangGuSiNode: React.FC<NodeProps> = () => {
  return (
    <div
      style={{
        padding: '8px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minWidth: 180,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {MEMORY_ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: STATUS_COLORS[item.status],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: '#c8c8c8',
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.4,
                userSelect: 'none',
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: '#666',
              }}
            >
              {item.status === 'ready' ? '就绪' : item.status}
            </span>
          </div>
        ))}
      </div>

      {/* 记忆容量指示 */}
      <div
        style={{
          margin: '8px 8px 4px',
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, color: '#666' }}>容量</span>
        <div
          style={{
            flex: 1,
            height: 4,
            background: '#2a2a2a',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '0%',
              height: '100%',
              background: '#4a9eff',
              borderRadius: 2,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: '#4a4a4a' }}>0%</span>
      </div>
    </div>
  );
};

export default ZhangGuSiNode;
