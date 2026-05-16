/**
 * 应用模式状态管理
 * 控制画布模式 / 工作台模式切换
 * 提供 resetAll 方法用于「新建」功能清空全部状态
 */
import { create } from 'zustand';
import { useCanvasStore } from './canvas-store';
import { useExecutionStore } from './execution-store';
import { usePanelDataStore } from './usePanelDataStore';
import { useLayoutStore } from './useLayoutStore';
import { useStickyPanelStore } from './useStickyPanelStore';

export type AppMode = 'canvas' | 'workbench';

interface AppStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  /** 新建全部：清空所有数据，保留已保存的工作流 */
  resetAll: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  mode: 'canvas',
  setMode: (mode) => set({ mode }),
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'canvas' ? 'workbench' : 'canvas',
    })),
  resetAll: () => {
    // 清空画布节点和边
    useCanvasStore.getState().clearCanvas();
    // 清空执行状态
    useExecutionStore.getState().resetAll();
    // 清空面板数据
    const panelDataStore = usePanelDataStore.getState();
    const allNodeIds = panelDataStore.getAllNodeIds();
    allNodeIds.forEach((id) => panelDataStore.removeNodeData(id));
    // 清空工作台面板
    useLayoutStore.getState().clearPanels();
    // 清空置顶面板
    useStickyPanelStore.getState().clearAll();
  },
}));
