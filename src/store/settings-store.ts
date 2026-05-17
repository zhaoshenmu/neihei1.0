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

/** 快捷键条目 */
export interface ShortcutEntry {
  id: string;
  label: string;
  keys: string[];      // 如 ['Delete'], ['Shift', 'Click'], ['Escape']
  description: string;
}

/** 连线款式：普线 | 流动 */
export type EdgeLineStyle = '普线' | '流动';

/** 设置接口 */
interface SettingsStore {
  /** Worker 执行超时时间（毫秒），默认 10000ms */
  workerTimeout: number;

  /** 是否显示端口标签 */
  showPortLabels: boolean;

  /** 连线款式 */
  edgeLineStyle: EdgeLineStyle;

  /** 快捷键列表（可编辑） */
  shortcuts: ShortcutEntry[];

  /** 更新设置（自动保存到 localStorage） */
  updateSetting: <K extends keyof Omit<SettingsStore, 'updateSetting' | 'loadSettings' | 'updateShortcut'>>(
    key: K,
    value: SettingsStore[K]
  ) => void;

  /** 更新单个快捷键 */
  updateShortcut: (id: string, keys: string[]) => void;

  /** 从 localStorage 加载设置 */
  loadSettings: () => void;

  /** 重置为默认值 */
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'neihei_settings';

const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
  { id: 'delete', label: '删除选中节点', keys: ['Delete'], description: '删除当前选中的节点' },
  { id: 'multi_select', label: '多选（追加选择）', keys: ['Shift', 'Click'], description: '按住 Shift 点击节点追加到选择' },
  { id: 'deselect', label: '取消选择', keys: ['Escape'], description: '取消所有选中' },
  { id: 'drag_select', label: '框选', keys: ['LeftDrag'], description: '左键拖动空白区域框选节点' },
  { id: 'open_panel', label: '打开节点配置', keys: ['DoubleClick'], description: '双击节点打开配置面板' },
  { id: 'create_node', label: '空白处双击创建', keys: ['DoubleClick'], description: '双击画布空白处弹出选择节点面板' },
  { id: 'pan_canvas', label: '平移画布', keys: ['RightDrag'], description: '右键/中键拖动平移画布' },
];

const DEFAULT_SETTINGS = {
  workerTimeout: 10000,
  showPortLabels: true,
  edgeLineStyle: '普线' as EdgeLineStyle,
  shortcuts: DEFAULT_SHORTCUTS,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  updateSetting: (key, value) => {
    set({ [key]: value } as any);
    // 自动持久化
    saveToStorage(get());
  },

  /** 更新单个快捷键 */
  updateShortcut: (id, keys) => {
    set((state) => ({
      shortcuts: state.shortcuts.map((s) =>
        s.id === id ? { ...s, keys } : s
      ),
    }));
    saveToStorage(get());
  },

  loadSettings: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 智能合并快捷键：保留用户自定义按键，同时补齐新增的默认条目
        const mergedShortcuts = DEFAULT_SHORTCUTS.map((def) => {
          const savedEntry = (parsed.shortcuts ?? []).find((s: ShortcutEntry) => s.id === def.id);
          return savedEntry ? { ...def, keys: savedEntry.keys } : def;
        });
        set({
          workerTimeout: parsed.workerTimeout ?? DEFAULT_SETTINGS.workerTimeout,
          showPortLabels: parsed.showPortLabels ?? DEFAULT_SETTINGS.showPortLabels,
          edgeLineStyle: parsed.edgeLineStyle ?? DEFAULT_SETTINGS.edgeLineStyle,
          shortcuts: mergedShortcuts,
        });
      }
    } catch {
      // 解析失败时使用默认值
    }
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS });
    saveToStorage({
      workerTimeout: DEFAULT_SETTINGS.workerTimeout,
      showPortLabels: DEFAULT_SETTINGS.showPortLabels,
      edgeLineStyle: DEFAULT_SETTINGS.edgeLineStyle,
      shortcuts: DEFAULT_SETTINGS.shortcuts,
    });
  },
}));

/** 持久化到 localStorage */
function saveToStorage(state: {
  workerTimeout: number;
  showPortLabels: boolean;
  edgeLineStyle: EdgeLineStyle;
  shortcuts: ShortcutEntry[];
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workerTimeout: state.workerTimeout,
      showPortLabels: state.showPortLabels,
      edgeLineStyle: state.edgeLineStyle,
      shortcuts: state.shortcuts,
    }));
  } catch {
    // localStorage 不可用时静默失败
  }
}
