/**
 * zhang-gu-si.store.ts
 *
 * 掌故司节点状态管理
 * 管理各标签的信号灯状态 + 悬浮面板数组
 *
 * 信号灯状态由外部事件驱动（数据流引擎/其他组件触发），非顺序流转
 * 面板状态：双击标签 → addPanel(tabId) 追加到 panels 数组
 *          右键面板 → removePanel(panelId) 从 panels 移除
 *          panelId 每次双击生成，支持同时打开多个标签的面板
 *
 * 注意：面板不自带 ✕ 关闭按钮，统一通过右键菜单关闭
 *
 * 与 world-editor-flow-store 的区别：
 * - 非线性：标签可并行运行，非从上到下顺序
 * - 可跳过：不需要的标签永远 stay waiting
 * - 事件驱动：由外部调用 setTabStatus 更新状态
 */
import { create } from 'zustand';
import type { SignalStatus } from '@/types';
import type {
  ZhangGuSiTabId,
  ZhangGuSiState,
  ZhangGuSiTabStatusMap,
  ZhangGuSiPanelEntry,
} from './types';

const defaultTabStatus = (): ZhangGuSiTabStatusMap => ({
  'outline-bind': 'waiting',
  'tab-02': 'waiting',
  'tab-03': 'waiting',
  'tab-04': 'waiting',
  'tab-05': 'waiting',
  'tab-06': 'waiting',
  'tab-07': 'waiting',
  'tab-08': 'waiting',
  'tab-09': 'waiting',
  'tab-10': 'waiting',
});

/** 自增计数器，确保 ID 不重复 */
let panelCounter = 0;

/** Store 扩展：面板管理 */
interface ZhangGuSiPanelState {
  /** 当前所有打开的悬浮面板列表 */
  panels: ZhangGuSiPanelEntry[];

  /** 双击标签 → 创建一个新面板（追加到 panels） */
  addPanel: (tabId: ZhangGuSiTabId) => void;

  /** 关闭指定面板（从 panels 移除） */
  removePanel: (panelId: string) => void;
}

export type ZhangGuSiStore = ZhangGuSiState & ZhangGuSiPanelState;

export const useZhangGuSiStore = create<ZhangGuSiStore>()((set) => ({
  // ─── 信号灯状态 ───
  tabStatus: defaultTabStatus(),

  /** 设置单个标签的信号灯状态（外部事件驱动调用） */
  setTabStatus: (tabId: ZhangGuSiTabId, status: SignalStatus) => {
    set((state) => ({
      tabStatus: { ...state.tabStatus, [tabId]: status },
    }));
  },

  /** 批量重置所有标签状态为 waiting */
  resetAllStatus: () => {
    set({ tabStatus: defaultTabStatus() });
  },

  // ─── 面板管理 ───
  panels: [],

  /** 双击标签 → 打开新面板（同一标签已有面板则跳过） */
  addPanel: (tabId: ZhangGuSiTabId) => {
    set((state) => {
      // 如果该标签已有面板打开，不再重复创建
      if (state.panels.some((p) => p.tabId === tabId)) return state;
      const id = `zhang-panel-${Date.now()}-${++panelCounter}`;
      return { panels: [...state.panels, { id, tabId }] };
    });
  },

  /** 关闭指定面板 */
  removePanel: (panelId: string) => {
    set((state) => ({
      panels: state.panels.filter((p) => p.id !== panelId),
    }));
  },
}));
