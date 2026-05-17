/**
 * api-settings-store.ts
 *
 * API 设置持久化存储（localStorage）
 * API Key 使用 AES-GCM 加密存储，明文永不落入 localStorage
 * 纯文本配置（URL、模型名等）直接存储
 *
 * 存储键名：neihei-api-settings
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptKey, decryptKey } from '@/utils/crypto';

/** 单个API配置 */
export interface ApiConfig {
  url: string;
  /** 始终存储加密后的key，读取时解密 */
  encryptedKey: string;
  model: string;
}

/** 所有API配置 */
export interface ApiSettings {
  generalApi: ApiConfig;
  localApi: ApiConfig;
  imageApi: ApiConfig;
}

/** Store 类型 */
interface ApiSettingsStore {
  settings: ApiSettings;
  /** 更新某个API配置（key 传入明文，自动加密存储） */
  updateApi: (type: keyof ApiSettings, config: Partial<ApiConfig> & { plainKey?: string }) => Promise<void>;
  /** 获取某个API配置的明文 key（解密后返回） */
  getPlainKey: (type: keyof ApiSettings) => Promise<string>;
  /** 获取某个API配置的完整信息（key 已解密） */
  getConfig: (type: keyof ApiSettings) => Promise<ApiConfig & { key: string }>;
}

const defaultSettings: ApiSettings = {
  generalApi: {
    url: 'https://api.deepseek.com',
    encryptedKey: '',
    model: 'deepseek-chat',
  },
  localApi: {
    url: 'http://localhost:1234',
    encryptedKey: '',
    model: '',
  },
  imageApi: {
    url: '',
    encryptedKey: '',
    model: '',
  },
};

export const useApiSettingsStore = create<ApiSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateApi: async (type, config) => {
        const current = get().settings;
        const target = current[type];

        let encryptedKey = target.encryptedKey;
        // 如果传入了明文 key，加密后存储
        if (config.plainKey !== undefined) {
          encryptedKey = config.plainKey
            ? await encryptKey(config.plainKey)
            : '';
        }

        set({
          settings: {
            ...current,
            [type]: {
              url: config.url ?? target.url,
              encryptedKey,
              model: config.model ?? target.model,
            },
          },
        });
      },

      getPlainKey: async (type) => {
        const encrypted = get().settings[type].encryptedKey;
        if (!encrypted) return '';
        const decrypted = await decryptKey(encrypted);
        return decrypted ?? '';
      },

      getConfig: async (type) => {
        const cfg = get().settings[type];
        const key = await decryptKey(cfg.encryptedKey);
        return {
          url: cfg.url,
          encryptedKey: cfg.encryptedKey,
          model: cfg.model,
          key: key ?? '',
        };
      },
    }),
    {
      name: 'neihei-api-settings',
      // 只持久化 settings 字段
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
