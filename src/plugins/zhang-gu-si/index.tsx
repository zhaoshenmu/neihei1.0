/**
 * zhang-gu-si 画布节点 - 掌故司节点 001
 *
 * 非线性信号灯标签列表节点
 * 每个标签前有信号圆点（waiting/running/done），双击标签弹出独立面板
 * 信号灯状态由外部事件驱动（数据流引擎），非顺序流转
 * 端口由 NodeWrapper 自动处理（1 入 1 出）
 *
 * 双击标签 => addPanel(tabId) => 创建 FloatingContainer（世界编辑器风格）
 * FloatingContainer 特性：可拖拽、可resize、无标题栏/✕按钮
 * 关闭方式：右键面板 → ContextMenu "关闭面板"
 *
 * 注意：面板渲染在 Canvas 层（ZhangGuSiPanels 组件），不在节点内
 * 这样即使节点被收起/折叠，面板依然保持打开
 *
 * 节点风格（与世界编辑器一致）：
 * ┌──────────────────────────────────┐
 * │ ⚙️ 掌故司 · 001    节点：001      │  ← NodeWrapper 标题栏
 * ├──────────────────────────────────┤
 * │ ● 大纲锚定绑定模块                │  ← 信号灯 + 标签（双击弹出面板）
 * │ ● [预留标签 02]                  │
 * │ ● [预留标签 03]                  │
 * │ ...                              │
 * ├──────────────────────────────────┤
 * │  ○ data-in         ○ data-out   │  ← NodeWrapper 端口
 * └──────────────────────────────────┘
 *
 * ✓ 已阅读 docs/standards/02-代码规范.md
 */
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NodeProps } from '@xyflow/react';
import { TABS } from './types';
import type { ZhangGuSiTabId } from './types';
import { useZhangGuSiStore } from './zhang-gu-si.store';
import { FloatingContainer } from '@/floating/FloatingContainer';
import { PANEL_WIDTH, PANEL_DEFAULT_HEIGHT, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT, PLUGIN_NODE_WIDTH, ZHANG_GU_SI } from '@/constants';
import { LazyPage } from './pages/page-registry';
import type { SignalStatus } from '@/types';
import ContextMenu from '@/canvas/ContextMenu';

/** 信号灯颜色映射 - 从 constants 引用 */
const SIGNAL_COLORS = ZHANG_GU_SI.SIGNAL_COLORS as Record<SignalStatus, string>;
const SIGNAL_GLOWS = ZHANG_GU_SI.SIGNAL_GLOWS as Record<SignalStatus, string>;

/** 标签名称映射 */
function getTabLabel(tabId: ZhangGuSiTabId): string {
  const tab = TABS.find((t) => t.id === tabId);
  return tab ? tab.label : tabId;
}

export default function ZhangGuSiNode(_props: NodeProps) {
  const tabStatus = useZhangGuSiStore((s) => s.tabStatus);
  const addPanel = useZhangGuSiStore((s) => s.addPanel);

  /** 双击标签打开独立面板（阻止冒泡到 Canvas，防止触发 openFloatForNode） */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, tabId: ZhangGuSiTabId) => {
      e.stopPropagation();
      addPanel(tabId);
    },
    [addPanel],
  );

  return (
    <div
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        padding: '6px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minWidth: PLUGIN_NODE_WIDTH.STANDARD,
        maxWidth: PLUGIN_NODE_WIDTH.WIDE,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* 标签列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {TABS.map((tab) => {
          const status = tabStatus[tab.id] || 'waiting';
          return (
            <div
              key={tab.id}
              onDoubleClick={(e) => handleDoubleClick(e, tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 8px',
                borderRadius: 4,
                cursor: 'default',
                transition: 'background 150ms ease',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* 信号灯圆点 */}
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
              {/* 标签文字 */}
              <span
                style={{
                  color: '#c8c8c8',
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.4,
                  userSelect: 'none',
                }}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ZhangGuSiPanels - 掌故司面板渲染组件
 *
 * 在 Canvas 层渲染，独立于节点生命周期
 * 即使节点被收起/折叠，面板依然保持打开
 *
 * 使用方式：在 Canvas.tsx 中引用 <ZhangGuSiPanels />
 */
export function ZhangGuSiPanels() {
  const panels = useZhangGuSiStore((s) => s.panels);
  const removePanel = useZhangGuSiStore((s) => s.removePanel);

  /** 面板右键菜单状态 */
  const [contextMenu, setContextMenu] = useState<{ panelId: string; x: number; y: number } | null>(null);

  /** 显示右键菜单 */
  const handlePanelContextMenu = useCallback(
    (panelId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ panelId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  /** 关闭右键菜单 */
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  /** 关闭面板 */
  const handleClose = useCallback(
    (panelId: string) => {
      removePanel(panelId);
      closeContextMenu();
    },
    [removePanel, closeContextMenu],
  );

  return (
    <>
      {/* ── 悬浮面板列表（每个 panel 一个 FloatingContainer） ── */}
      {panels.map((panel) => {
        const tabName = getTabLabel(panel.tabId);

        return (
          <FloatingContainer
            key={panel.id}
            nodeId=""
            pluginType="zhang-gu-si"
            title={`掌故司 · ${tabName}`}
            defaultWidth={PANEL_WIDTH}
            defaultHeight={PANEL_DEFAULT_HEIGHT}
            minWidth={PANEL_WIDTH}
            maxWidth={PANEL_WIDTH}
            minHeight={PANEL_MIN_HEIGHT}
            maxHeight={PANEL_MAX_HEIGHT}
            onClose={() => removePanel(panel.id)}
            onContextMenu={(e) => handlePanelContextMenu(panel.id, e)}
          >
            {/* 面板内容（通过 page-registry LazyPage 按需加载，每个标签独立文件夹） */}
            <div
              style={{
                height: '100%',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                overflowY: 'auto',
                color: '#b0b0b0',
              }}
            >
              <LazyPage tabId={panel.tabId} />
            </div>
          </FloatingContainer>
        );
      })}

      {/* 右键菜单（createPortal 到 body，避免 CSS transform 影响 position: fixed） */}
      {contextMenu &&
        createPortal(
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              {
                label: '置顶到画布',
                onClick: () => {
                  // 置顶功能暂未实现，保留占位
                  closeContextMenu();
                },
              },
              { label: '', onClick: () => {}, divider: true },
              {
                label: '关闭面板',
                danger: true,
                onClick: () => handleClose(contextMenu.panelId),
              },
            ]}
            onClose={closeContextMenu}
          />,
          document.body,
        )}
    </>
  );
}
