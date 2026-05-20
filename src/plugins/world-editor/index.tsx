/**
 * Outline 节点 - 大纲编辑器
 * 显示世界观、主线、人物、卷大纲、章节锚点标题
 * 每行前面带信号原点（AI 执行状态指示）
 * 端口：
 * - 输入：左上 trigger-in
 * - 输出：右下 trigger-out（在标签下面）
 */
import React from 'react';
import { TABS } from './types';
import { useWorldEditorFlowStore } from '@/store/world-editor-flow-store';
import type { SignalStatus, WorldEditorTabId as TabId } from '@/types';

/** 信号原点颜色映射 */
const SIGNAL_COLORS: Record<SignalStatus, string> = {
  waiting: '#4a4a4a',
  running: '#ff69b4',
  done: '#44cc44',
};

/** 信号原点发光效果 */
const SIGNAL_GLOWS: Record<SignalStatus, string> = {
  waiting: 'none',
  running: '0 0 6px rgba(255, 105, 180, 0.6)',
  done: '0 0 6px rgba(68, 204, 68, 0.4)',
};

export default function OutlineNode() {
  // 从 store 中读取每个标签页的运行状态
  const stepStatus = useWorldEditorFlowStore((s) => s.stepStatus);
  // 同步 TABS 并读取实时状态
  const items = React.useMemo(() => 
    TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      status: stepStatus[tab.id as TabId] || 'waiting',
    })),
    [stepStatus]
  );

  return (
    <div
      style={{
        padding: '6px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minWidth: 200,
        maxWidth: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* 左侧列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 8px',
              borderRadius: 4,
              transition: 'background 150ms ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: SIGNAL_COLORS[item.status],
                boxShadow: SIGNAL_GLOWS[item.status],
                flexShrink: 0,
                transition: 'all 300ms ease',
              }}
            />
            <span
              style={{
                color: '#c8c8c8',
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.4,
                userSelect: 'none',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
