/**
 * Panel.tsx — 掌故司面板组件
 *
 * 由 canvas 层通过 openFloatForNode 调用的面板入口。
 * 由于掌故司节点已在 index.tsx 内部自行管理 FloatingContainer（双击标签创建），
 * 此面板仅作为 plugin-loader 的 import.meta.glob 后备导出。
 *
 * 当 canvas 层双击节点时（未阻止冒泡的情况），此组件会被
 * FloatingContainer 包裹展示。
 */

import { TABS } from './types';
import type { ZhangGuSiTabId } from './types';
import { useZhangGuSiStore } from './zhang-gu-si.store';
import { ZHANG_GU_SI } from '@/constants';

interface Props {
  nodeId?: string;
}

const SIGNAL_COLORS = ZHANG_GU_SI.SIGNAL_COLORS;
const SIGNAL_GLOWS = ZHANG_GU_SI.SIGNAL_GLOWS;

export default function Panel(_props: Props) {
  const tabStatus = useZhangGuSiStore((s) => s.tabStatus);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: '#b0b0b0',
        fontSize: 13,
      }}
    >
      {TABS.map((tab) => {
        const status = tabStatus[tab.id as ZhangGuSiTabId] || 'waiting';
        return (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 8px',
              borderRadius: 4,
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: SIGNAL_COLORS[status],
                boxShadow: SIGNAL_GLOWS[status],
                flexShrink: 0,
                transition: 'all 300ms ease',
              }}
            />
            <span style={{ color: '#c8c8c8', fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
