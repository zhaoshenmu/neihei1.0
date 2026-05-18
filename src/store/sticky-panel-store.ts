/**
 * useStickyPanelStore.ts
 * 
 * 置顶面板状态管理 - 仅内存存储（不持久化）
 * 固定在画布上不会消失的面板
 * 浏览器刷新后清除（符合用户要求）
 */
import { create } from 'zustand';

export interface StickyPanel {
  id: string;
  pluginType: string;
  nodeId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface StickyPanelStore {
  panels: StickyPanel[];
  addPanel: (panel: Omit<StickyPanel, 'x' | 'y' | 'width' | 'height' | 'zIndex'> & { x?: number; y?: number; width?: number; height?: number }) => void;
  removePanel: (panelId: string) => void;
  updatePosition: (panelId: string, x: number, y: number) => void;
  updateSize: (panelId: string, width: number, height: number) => void;
  bringToFront: (panelId: string) => void;
  hasPanel: (nodeId: string) => boolean;
  getPanelByNodeId: (nodeId: string) => StickyPanel | undefined;
  clearAll: () => void;
}

export const useStickyPanelStore = create<StickyPanelStore>()(
  (set, get) => ({
    panels: [],

    addPanel: (panel) => {
      // 去重：同一个 nodeId 不允许添加第二个
      const existingByNode = get().panels.find((p) => p.nodeId === panel.nodeId);
      if (existingByNode) return;
      const existingById = get().panels.find((p) => p.id === panel.id);
      if (existingById) return;

      const maxZ = Math.max(0, ...get().panels.map((p) => p.zIndex));
      const offset = (get().panels.length % 10) * 30;

      set((state) => ({
        panels: [
          ...state.panels,
          {
            ...panel,
            x: panel.x ?? 100 + offset,
            y: panel.y ?? 100 + offset,
            width: panel.width ?? 420,
            height: panel.height ?? 300,
            zIndex: maxZ + 1,
          },
        ],
      }));
    },

    removePanel: (panelId) => {
      set((state) => ({
        panels: state.panels.filter((p) => p.id !== panelId),
      }));
    },

    updatePosition: (panelId, x, y) => {
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId ? { ...p, x, y } : p
        ),
      }));
    },

    updateSize: (panelId, width, height) => {
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId ? { ...p, width, height } : p
        ),
      }));
    },

    bringToFront: (panelId) => {
      const maxZ = Math.max(0, ...get().panels.map((p) => p.zIndex));
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId ? { ...p, zIndex: maxZ + 1 } : p
        ),
      }));
    },

    hasPanel: (nodeId) => {
      return get().panels.some((p) => p.nodeId === nodeId);
    },

    getPanelByNodeId: (nodeId) => {
      return get().panels.find((p) => p.nodeId === nodeId);
    },

    clearAll: () => set({ panels: [] }),
  })
);
