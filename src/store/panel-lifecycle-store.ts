/**
 * usePanelLifecycleStore.ts
 * 
 * 面板生命周期管理 - 按 fixedId（固定ID）追踪
 * 
 * 每个固定 ID 全局共享一个生命周期：
 * - 最多弹出 2 次面板（置顶到画布）
 * - 两次机会用完即永久关闭，画布上所有同类型节点实例都无法再弹出
 */
import { create } from 'zustand';

export interface LifecycleEntry {
  /** 该 fixedId 是否已固定 */
  isPinned: boolean;
  /** 该 fixedId 是否已置顶到画布 */
  isSticky: boolean;
}

interface PanelLifecycleStore {
  /** key = fixedId (如 "001"), value = 生命周期状态 */
  entries: Record<string, LifecycleEntry>;

  /** 获取某个 fixedId 的生命周期状态 */
  getLifecycle: (fixedId: string) => LifecycleEntry;

  /** 标记为已固定 */
  markPinned: (fixedId: string) => void;

  /** 标记为已置顶到画布 */
  markSticky: (fixedId: string) => void;

  /** 取消标记（关闭置顶面板时调用，允许下次再次置顶） */
  unmarkSticky: (fixedId: string) => void;

  /** 取消固定标记（允许下次再次固定） */
  unmarkPin: (fixedId: string) => void;

  /** 检查该 fixedId 是否有可用弹出机会（两者都已用则返回 false） */
  canPopup: (fixedId: string) => boolean;

  /** 检查固定按钮是否可用 */
  canPin: (fixedId: string) => boolean;

  /** 检查置顶按钮是否可用 */
  canSticky: (fixedId: string) => boolean;

  /** 重置某个 fixedId（用于调试/测试） */
  reset: (fixedId: string) => void;

  /** 重置所有 */
  resetAll: () => void;
}

const defaultEntry: LifecycleEntry = { isPinned: false, isSticky: false };

export const usePanelLifecycleStore = create<PanelLifecycleStore>()(
  (set, get) => ({
    entries: {},

    getLifecycle: (fixedId) => {
      return get().entries[fixedId] || { ...defaultEntry };
    },

    markPinned: (fixedId) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [fixedId]: {
            ...(state.entries[fixedId] || defaultEntry),
            isPinned: true,
          },
        },
      }));
    },

    markSticky: (fixedId) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [fixedId]: {
            ...(state.entries[fixedId] || defaultEntry),
            isSticky: true,
          },
        },
      }));
    },

    unmarkSticky: (fixedId) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [fixedId]: {
            ...(state.entries[fixedId] || defaultEntry),
            isSticky: false,
          },
        },
      }));
    },

    unmarkPin: (fixedId) => {
      set((state) => ({
        entries: {
          ...state.entries,
          [fixedId]: {
            ...(state.entries[fixedId] || defaultEntry),
            isPinned: false,
          },
        },
      }));
    },

    canPopup: (fixedId) => {
      const entry = get().entries[fixedId] || defaultEntry;
      return !(entry.isPinned && entry.isSticky);
    },

    canPin: (fixedId) => {
      const entry = get().entries[fixedId] || defaultEntry;
      return !entry.isPinned;
    },

    canSticky: (fixedId) => {
      const entry = get().entries[fixedId] || defaultEntry;
      return !entry.isSticky;
    },

    reset: (fixedId) => {
      set((state) => {
        const { [fixedId]: _, ...rest } = state.entries;
        return { entries: rest };
      });
    },

    resetAll: () => set({ entries: {} }),
  })
);
