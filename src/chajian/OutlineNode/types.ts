/** 大纲编辑器面板的标签页类型 */
export type TabId = 'setting' | 'world' | 'character' | 'plot' | 'consistency';

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

/** 面板宽度常量 */
export const PANEL_WIDTH = 400;
export const PANEL_DEFAULT_HEIGHT = 900;
export const PANEL_MIN_HEIGHT = 400;
export const PANEL_MAX_HEIGHT = 1200;
