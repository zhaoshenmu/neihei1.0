/**
 * zhang-gu-si 类型定义
 *
 * 掌故司节点标签 ID，全英文 kebab-case
 * 显示名称（label）使用中文字符串
 */

import type { SignalStatus } from '@/types';

/** 掌故司标签 ID 枚举 */
export type ZhangGuSiTabId =
  /** 001: 大纲锚定绑定模块 */
  | 'outline-bind'
  /** 预留标签位 */
  | 'tab-02'
  | 'tab-03'
  | 'tab-04'
  | 'tab-05'
  | 'tab-06'
  | 'tab-07'
  | 'tab-08'
  | 'tab-09'
  | 'tab-10';

/** 掌故司标签定义 */
export interface ZhangGuSiTabDef {
  /** 英文标识（代码中使用） */
  id: ZhangGuSiTabId;
  /** 中文显示名称（UI 展示） */
  label: string;
}

/** 标签状态映射：tabId → SignalStatus */
export type ZhangGuSiTabStatusMap = Record<ZhangGuSiTabId, SignalStatus>;

/** 掌故司 Store 状态 */
export interface ZhangGuSiState {
  /** 各标签的实时信号状态 */
  tabStatus: ZhangGuSiTabStatusMap;

  /** 设置单个标签的状态 */
  setTabStatus: (tabId: ZhangGuSiTabId, status: SignalStatus) => void;
  /** 批量重置所有标签状态为 waiting */
  resetAllStatus: () => void;
}

/** 悬浮面板条目（支持同时打开多个面板） */
export interface ZhangGuSiPanelEntry {
  /** 面板唯一 ID（每次双击生成，用于关闭特定面板） */
  id: string;
  /** 所属标签 ID */
  tabId: ZhangGuSiTabId;
}

/**
 * 掌故司标签列表
 * 只有第一个标签 named 'outline-bind' 已激活展示，其余为预留
 */
export const TABS: ZhangGuSiTabDef[] = [
  { id: 'outline-bind', label: '大纲锚定绑定模块' },
  { id: 'tab-02', label: '预留标签 02' },
  { id: 'tab-03', label: '预留标签 03' },
  { id: 'tab-04', label: '预留标签 04' },
  { id: 'tab-05', label: '预留标签 05' },
  { id: 'tab-06', label: '预留标签 06' },
  { id: 'tab-07', label: '预留标签 07' },
  { id: 'tab-08', label: '预留标签 08' },
  { id: 'tab-09', label: '预留标签 09' },
  { id: 'tab-10', label: '预留标签 10' },
];
