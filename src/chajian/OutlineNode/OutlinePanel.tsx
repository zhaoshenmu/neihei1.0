/**
 * Outline 悬浮面板
 * 双击大纲编辑器节点时弹出
 * 宽度固定 400px，高度默认 900px，可通过右下角手柄垂直调整
 * 顶部 5 个标签：作品设定、世界构建、人物核心、剧情大纲、一致性检查
 */
import React, { useState } from 'react';
import { theme } from '@/theme/neihei-theme';
import { TABS } from './types';
import type { TabId } from './types';
import PageSetting from './pages/PageSetting';
import PageWorld from './pages/PageWorld';
import PageCharacter from './pages/PageCharacter';
import PagePlot from './pages/PagePlot';
import PageConsistency from './pages/PageConsistency';

interface Props {
  nodeId: string;
}

const OutlinePanel: React.FC<Props> = ({ nodeId: _nodeId }) => {
  const [activeTab, setActiveTab] = useState<TabId>('setting');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 标签栏 */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          background: '#0a0a0a',
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${theme.colors.nodeBorderSelected}`
                  : '2px solid transparent',
              color:
                activeTab === tab.id
                  ? theme.colors.textPrimary
                  : theme.colors.textMuted,
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          padding: '14px 16px',
          overflowY: 'auto',
          color: theme.colors.textPrimary,
        }}
      >
        {activeTab === 'setting' && <PageSetting />}
        {activeTab === 'world' && <PageWorld />}
        {activeTab === 'character' && <PageCharacter />}
        {activeTab === 'plot' && <PagePlot />}
        {activeTab === 'consistency' && <PageConsistency />}
      </div>
    </div>
  );
};

export default OutlinePanel;
