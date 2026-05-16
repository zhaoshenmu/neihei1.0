/**
 * IdeaNode 面板组件
 * 管理想法内容、标签和备注
 * 数据层：usePanelDataStore 共享存储
 * 风格：#0d0d0d / #111111 深度统一
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';
import { theme } from '@/theme/neihei-theme';

interface Props {
  nodeId: string;
}

export default function IdeaPanel({ nodeId }: Props) {
  const data = usePanelDataStore();
  const text = data.getNodeData(nodeId, 'text') || '';
  const tags = data.getNodeData(nodeId, 'tags') || '';

  React.useEffect(() => {
    data.initNodeData(nodeId, { text: '', tags: '' });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.colors.textPrimary, fontSize: 14 }}>
        想法编辑
      </h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, color: theme.colors.textSecondary, fontSize: 12 }}>
          想法内容
        </label>
        <textarea
          value={text}
          onChange={(e) => data.updateNodeData(nodeId, 'text', e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#0d0d0d',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 4,
            color: theme.colors.textPrimary,
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, color: theme.colors.textSecondary, fontSize: 12 }}>
          标签（逗号分隔）
        </label>
        <input
          value={tags}
          onChange={(e) => data.updateNodeData(nodeId, 'tags', e.target.value)}
          placeholder="例如: 创意, 前端, UI"
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
        字数: {text.length}
      </div>
    </div>
  );
}
