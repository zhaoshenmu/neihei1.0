/**
 * 面板数据存储
 * 存储每个节点的面板表单数据，支持持久化
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelDataStore {
  data: Record<string, Record<string, any>>;
  getNodeData: (nodeId: string, key: string) => any;
  updateNodeData: (nodeId: string, key: string, value: any) => void;
  initNodeData: (nodeId: string, defaultValues: Record<string, any>) => void;
  removeNodeData: (nodeId: string) => void;
  getAllNodeIds: () => string[];
}

export const usePanelDataStore = create<PanelDataStore>()(
  persist(
    (set, get) => ({
      data: {},
      getNodeData: (nodeId, key) => get().data[nodeId]?.[key],
      updateNodeData: (nodeId, key, value) =>
        set((state) => ({
          data: {
            ...state.data,
            [nodeId]: { ...state.data[nodeId], [key]: value },
          },
        })),
      initNodeData: (nodeId, defaultValues) =>
        set((state) => {
          if (state.data[nodeId]) return state;
          return { data: { ...state.data, [nodeId]: defaultValues } };
        }),
      removeNodeData: (nodeId) =>
        set((state) => {
          const newData = { ...state.data };
          delete newData[nodeId];
          return { data: newData };
        }),
      getAllNodeIds: () => Object.keys(get().data),
    }),
    {
      name: 'neihei-panel-data',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2 && state && typeof state === 'object') {
          // 迁移到 v2：确保 characters 数组中每个角色对象都有 personality 字段
          const data = (state.data ?? {}) as Record<string, Record<string, unknown>>;
          for (const nodeId of Object.keys(data)) {
            const chars = data[nodeId]?.characters;
            if (Array.isArray(chars)) {
              data[nodeId].characters = chars.map((c: unknown) => {
                if (typeof c === 'string') {
                  return { name: c, desire: '', flaw: '', arc: '', personality: '' };
                }
                if (typeof c === 'object' && c !== null) {
                  const obj = c as Record<string, unknown>;
                  return {
                    ...obj,
                    desire: typeof obj.desire === 'string' ? obj.desire : '',
                    flaw: typeof obj.flaw === 'string' ? obj.flaw : '',
                    arc: typeof obj.arc === 'string' ? obj.arc : '',
                    personality: typeof obj.personality === 'string' ? obj.personality : '',
                  };
                }
                return c;
              });
            }
          }
          return { data } as any;
        }
        return persistedState as any;
      },
    }
  )
);
