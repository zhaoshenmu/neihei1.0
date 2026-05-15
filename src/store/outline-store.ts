/**
 * Outline 面板状态管理
 * 使用 Zustand 管理面板的打开/关闭状态
 */
import { create } from 'zustand';

interface OutlineStore {
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

export const useOutlineStore = create<OutlineStore>((set) => ({
  panelOpen: false,
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));
