/**
 * CounterNode 工作台面板组件
 * 计数器节点 - 记录和展示节点计数数据
 * 数据层：usePanelDataStore 共享存储
 * 风格：#0d0d0d / #111111 深度统一
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';
import { theme } from '@/theme/neihei-theme';

interface Props {
  nodeId: string;
}

export default function CounterPanel({ nodeId }: Props) {
  const data = usePanelDataStore();
  const count = data.getNodeData(nodeId, 'count') ?? 0;
  const label = data.getNodeData(nodeId, 'label') || '计数器';
  const step = data.getNodeData(nodeId, 'step') ?? 1;

  // 首次加载初始化
  React.useEffect(() => {
    data.initNodeData(nodeId, { count: 0, label: '计数器', step: 1 });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.colors.textPrimary, fontSize: 14 }}>
        {label}
      </h3>

      <div
        style={{
          background: '#0d0d0d',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          border: `1px solid ${theme.colors.inputBorder}`,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
          {count}
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>
          当前计数
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => data.updateNodeData(nodeId, 'count', Number(count) - Number(step))}
          style={{
            flex: 1,
            padding: '10px 0',
            background: '#111111',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 6,
            color: theme.colors.textPrimary,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111111'; }}
        >
          −
        </button>
        <button
          onClick={() => data.updateNodeData(nodeId, 'count', Number(count) + Number(step))}
          style={{
            flex: 1,
            padding: '10px 0',
            background: '#111111',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 6,
            color: theme.colors.textPrimary,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111111'; }}
        >
          +
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, color: theme.colors.textSecondary, fontSize: 12 }}>
          步长
        </label>
        <input
          type="number"
          value={step}
          onChange={(e) => data.updateNodeData(nodeId, 'step', Number(e.target.value))}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#0d0d0d',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 4,
            color: theme.colors.textPrimary,
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>
        节点 ID: {nodeId.slice(0, 8)}
      </div>
    </div>
  );
}
