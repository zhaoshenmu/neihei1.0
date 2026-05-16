/**
 * settings-store.ts
 * 
 * 设置状态管理
 * 所有设置持久化到 localStorage
 * 
 * 设置项：
 * - 画布缩放（留用，当前由 React Flow 控制）
 * - Worker 超时时间（Timeout）
 * - 主题（未来扩展）
 * 
 * 设计原则：
 * - 所有设置项有默认值
 * - 每次修改自动保存到 localStorage
 * - 应用启动时从 localStorage 恢复
 */

import { create } from 'zustand';

/** 设置接口 */
interface SettingsStore {
  /** Worker 执行超时时间（毫秒），默认 10000ms */
  workerTimeout: number;

  /** 是否显示端口标签 */
  showPortLabels: boolean;

  /** 更新设置（自动保存到 localStorage） */
  updateSetting: <K extends keyof Omit<SettingsStore, 'updateSetting' | 'loadSettings'>>(
    key: K,
    value: SettingsStore[K]
  ) => void;

  /** 从 localStorage 加载设置 */
  loadSettings: () => void;

  /** 重置为默认值 */
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'neihei_settings';

const DEFAULT_SETTINGS = {
  workerTimeout: 10000,
  showPortLabels: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  updateSetting: (key, value) => {
    set({ [key]: value } as any);
    // 自动持久化
    const state = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        workerTimeout: state.workerTimeout,
        showPortLabels: state.showPortLabels,
      }));
    } catch {
      // localStorage 不可用时静默失败
    }
  },

  loadSettings: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          workerTimeout: parsed.workerTimeout ?? DEFAULT_SETTINGS.workerTimeout,
          showPortLabels: parsed.showPortLabels ?? DEFAULT_SETTINGS.showPortLabels,
        });
      }
    } catch {
      // 解析失败时使用默认值
    }
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // 静默失败
    }
  },
}));
