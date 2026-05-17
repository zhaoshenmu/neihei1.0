/**
 * api-connection-store.ts
 * 
 * API连接状态管理
 * 记录每个API的连通状态（绿色=已连接，灰色=未连接）
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing';

export type ApiId = 'general-api' | 'local-api' | 'image-api';

interface ApiConnectionState {
  /** key为apiId，value为连接状态 */
  statuses: Record<string, ConnectionStatus>;
  /** 当前用户选中的API ID（数据流调用时使用此API） */
  selectedApi: ApiId;
  setStatus: (apiId: string, status: ConnectionStatus) => void;
  /** 设置当前选中的API */
  setSelectedApi: (apiId: ApiId) => void;
}

export const useApiConnectionStore = create<ApiConnectionState>()(
  persist(
    (set) => ({
      statuses: {
        'general-api': 'disconnected',
        'local-api': 'disconnected',
        'image-api': 'disconnected',
      },
      selectedApi: 'general-api',
      setStatus: (apiId, status) =>
        set((state) => ({
          statuses: { ...state.statuses, [apiId]: status },
        })),
      setSelectedApi: (apiId) =>
        set({ selectedApi: apiId }),
    }),
    { name: 'neihei-api-connections' }
  )
);
