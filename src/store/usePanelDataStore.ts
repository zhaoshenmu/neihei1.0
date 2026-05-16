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
    { name: 'neihei-panel-data' }
  )
);
