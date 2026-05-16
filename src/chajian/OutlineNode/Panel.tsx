/**
 * OutlineNode 工作台面板组件
 * 在大纲节点的工作台面板中展示大纲编辑器
 * 数据层：usePanelDataStore 共享存储
 * 风格：#0d0d0d / #111111 深度统一
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';
import { theme } from '@/theme/neihei-theme';

interface Props {
  nodeId: string;
}

const TABS = ['世界观', '主线', '人物', '卷大纲', '章节锚点'];

export default function OutlinePanel({ nodeId }: Props) {
  const data = usePanelDataStore();
  const activeTab = data.getNodeData(nodeId, 'activeTab') || TABS[0];

  React.useEffect(() => {
    data.initNodeData(nodeId, { activeTab: TABS[0] });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', color: theme.colors.textPrimary, fontSize: 14 }}>
        大纲编辑器
      </h3>
      <div style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 }}>
        节点 ID: {nodeId.slice(0, 8)}
      </div>

      {/* 标签栏 */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => data.updateNodeData(nodeId, 'activeTab', tab)}
            style={{
              padding: '4px 10px',
              background: activeTab === tab ? '#111111' : '#0d0d0d',
              border: activeTab === tab
                ? `1px solid ${theme.colors.nodeBorderSelected}`
                : `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 4,
              color: activeTab === tab ? theme.colors.textPrimary : theme.colors.textSecondary,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#0d0d0d',
          borderRadius: 4,
          padding: 16,
          color: theme.colors.textMuted,
          fontSize: 13,
          textAlign: 'center',
          border: `1px dashed ${theme.colors.inputBorder}`,
        }}
      >
        {activeTab} 内容待设计...
      </div>
    </div>
  );
}
