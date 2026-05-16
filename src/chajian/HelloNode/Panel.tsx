/**
 * HelloNode 面板组件
 * 演示节点 - 展示文本消息
 * 数据层：usePanelDataStore 共享存储
 * 风格：#0d0d0d / #111111 深度统一
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';
import { theme } from '@/theme/neihei-theme';

interface Props {
  nodeId: string;
}

export default function HelloPanel({ nodeId }: Props) {
  const data = usePanelDataStore();
  const message = data.getNodeData(nodeId, 'message') || '你好，世界！';

  React.useEffect(() => {
    data.initNodeData(nodeId, { message: '你好，世界！' });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.colors.textPrimary, fontSize: 14 }}>
        Hello 节点
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
        <div style={{ fontSize: 24, color: theme.colors.textPrimary, marginBottom: 8 }}>
          {message}
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>
          编辑下方内容以更新消息
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, color: theme.colors.textSecondary, fontSize: 12 }}>
          消息内容
        </label>
        <input
          value={message}
          onChange={(e) => data.updateNodeData(nodeId, 'message', e.target.value)}
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
