/**
 * 应用状态管理
 * 提供 resetAll 方法用于「新建」功能清空全部状态
 * 去掉了 workbench 模式，只保留画布模式
 */
import { create } from 'zustand';
import { useCanvasStore } from './canvas-store';
import { useExecutionStore } from './execution-store';
import { usePanelDataStore } from './usePanelDataStore';
import { useStickyPanelStore } from './useStickyPanelStore';

interface AppStore {
  /** 新建全部：清空所有数据，保留已保存的工作流 */
  resetAll: () => void;
}

export const useAppStore = create<AppStore>(() => ({
  resetAll: () => {
    // 清空画布节点和边
    useCanvasStore.getState().clearCanvas();
    // 清空执行状态
    useExecutionStore.getState().resetAll();
    // 清空面板数据
    const panelDataStore = usePanelDataStore.getState();
    const allNodeIds = panelDataStore.getAllNodeIds();
    allNodeIds.forEach((id) => panelDataStore.removeNodeData(id));
    // 清空置顶面板
    useStickyPanelStore.getState().clearAll();
  },
}));
