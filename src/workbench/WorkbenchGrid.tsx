/**
 * WorkbenchGrid.tsx
 * 
 * 工作台网格布局 - 使用 react-grid-layout v2
 * 将节点面板按网格排列，支持拖拽调整位置和大小
 * 
 * Bug 3 修复：色调统一为深色 #0d0d0d / #111111 匹配节点面板弹出窗口
 */
import { useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import { verticalCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useLayoutStore } from '@/store/useLayoutStore';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { theme } from '@/theme/neihei-theme';

export function WorkbenchGrid() {
  const { layout, panels, setLayout, removePanel } = useLayoutStore();

  const onLayoutChange = useCallback(
    (newLayout: any) => {
      setLayout(newLayout);
    },
    [setLayout]
  );

  if (!panels.length) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.textMuted,
          fontSize: 16,
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.3 }}>📋</div>
        <div>工作台暂无面板</div>
        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
          双击画布上的节点，在悬浮窗中点击「📌 固定」即可添加到工作台
        </div>
      </div>
    );
  }

  return (
    <GridLayout
      className="layout"
      width={1200}
      layout={layout as any}
      gridConfig={{
        cols: 12,
        rowHeight: 50,
        margin: [8, 8] as [number, number],
        containerPadding: [8, 8] as [number, number],
        maxRows: Infinity,
      }}
      dragConfig={{
        enabled: true,
        handle: '.grid-drag-handle',
        bounded: false,
      }}
      resizeConfig={{
        enabled: true,
        handles: ['se', 'sw', 'ne', 'nw'] as any,
      }}
      compactor={verticalCompactor}
      onLayoutChange={onLayoutChange as any}
      autoSize
      style={{ minHeight: '100%' }}
    >
      {panels.map((panel) => {
        const PanelComp = pluginRegistry.getPanel(panel.pluginType);
        return (
          <div
            key={panel.id}
            style={{
              /** Bug 3 修复：深色 #0d0d0d 背景，匹配节点弹出面板 */
              background: '#0d0d0d',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${theme.colors.inputBorder}`,
            }}
          >
            {/* 标题栏 - 拖拽手柄 */}
            <div
              className="grid-drag-handle"
              style={{
                padding: '6px 12px',
                /** Bug 3 修复：#111111 标题栏背景，匹配节点弹出面板 */
                background: '#111111',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
                flexShrink: 0,
                minHeight: 32,
              }}
            >
              <span style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: 600 }}>
                {panel.label || panel.pluginType}
              </span>
              <button
                onClick={() => removePanel(panel.id)}
                title="从工作台移除"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.colors.textMuted,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
              >
                ✕
              </button>
            </div>

            {/* 面板内容 - 可滚动 */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 12,
                paddingBottom: 4,
                color: theme.colors.textPrimary,
                fontSize: 13,
                position: 'relative',
              }}
            >
              {PanelComp ? (
                <PanelComp nodeId={panel.nodeId} />
              ) : (
                <div style={{ color: theme.colors.textMuted, padding: 16, textAlign: 'center' }}>
                  该节点暂无配置面板
                </div>
              )}
            </div>

            {/* 右下角类型 ID */}
            <div
              style={{
                padding: '2px 10px 4px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.15)',
                  fontWeight: 400,
                  userSelect: 'text',
                  letterSpacing: '0.3px',
                }}
              >
                ID:{pluginRegistry.getShortId(panel.pluginType) || panel.pluginType.slice(0, 4)}
              </span>
            </div>
          </div>
        );
      })}
    </GridLayout>
  );
}
