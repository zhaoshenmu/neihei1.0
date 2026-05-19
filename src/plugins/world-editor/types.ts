/**
 * world-editor 类型定义
 * 
 * 面板尺寸常量已迁移至 @/constants，此处 re-export 以保持向后兼容
 */
import type { WorldEditorTabId as TabId } from '@/types';
export { PANEL_WIDTH, PANEL_DEFAULT_HEIGHT, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT } from '@/constants';

/** 标签页定义 */
export interface TabDef {
  id: TabId;
  label: string;
}

/** 标签页配置列表 */
export const TABS: TabDef[] = [
  { id: 'setting', label: '作品设定' },
  { id: 'world', label: '世界构建' },
  { id: 'character', label: '人物核心' },
  { id: 'plot', label: '剧情大纲' },
  { id: 'consistency', label: '一致性检查' },
];

export type { TabId };
