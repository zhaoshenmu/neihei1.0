/**
 * 工作台布局状态管理
 * 管理 react-grid-layout 的布局配置，支持持久化
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';

export interface WorkbenchPanel {
  /** 面板唯一标识，格式: "pluginType:nodeId" */
  id: string;
  /** 插件类型 */
  pluginType: string;
  /** 节点 ID */
  nodeId: string;
  /** 面板标题 */
  label: string;
}

interface LayoutStore {
  layout: Layout;
  panels: WorkbenchPanel[];
  setLayout: (layout: Layout) => void;
  addPanel: (panel: WorkbenchPanel, position?: { x: number; y: number }) => void;
  removePanel: (panelId: string) => void;
  hasPanel: (nodeId: string) => boolean;
  getPanelByNodeId: (nodeId: string) => WorkbenchPanel | undefined;
  clearPanels: () => void;
  /** 同步：从画布节点列表更新面板（只添加不删除） */
  syncWithCanvasNodes: (canvasNodeTypes: { id: string; type: string; label: string }[]) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      layout: [],
      panels: [],

      setLayout: (layout) => set({ layout }),

      addPanel: (panel, position) => {
        const existing = get().panels.find((p) => p.id === panel.id);
        if (existing) return; // 不重复添加

        const maxX = Math.max(0, ...get().layout.map((l) => l.x + l.w));
        const x = position?.x ?? (maxX > 10 ? 0 : maxX);
        const y = position?.y ?? 0;

        set((state) => ({
          panels: [...state.panels, panel],
          layout: [
            ...state.layout,
            {
              i: panel.id,
              x,
              y,
              w: 4,
              h: 8,
              minW: 3,
              minH: 4,
            },
          ],
        }));
      },

      removePanel: (panelId) => {
        set((state) => ({
          panels: state.panels.filter((p) => p.id !== panelId),
          layout: state.layout.filter((l) => l.i !== panelId),
        }));
      },

      hasPanel: (nodeId) => {
        return get().panels.some((p) => p.nodeId === nodeId);
      },

      getPanelByNodeId: (nodeId) => {
        return get().panels.find((p) => p.nodeId === nodeId);
      },

      clearPanels: () => set({ panels: [], layout: [] }),

      syncWithCanvasNodes: (canvasNodeTypes) => {
        const { panels, addPanel } = get();
        canvasNodeTypes.forEach((node) => {
          const panelId = `${node.type}:${node.id}`;
          const exists = panels.some((p) => p.id === panelId);
          if (!exists) {
            addPanel({
              id: panelId,
              pluginType: node.type,
              nodeId: node.id,
              label: node.label,
            });
          }
        });
      },
    }),
    { name: 'neihei-workbench-layout' }
  )
);
