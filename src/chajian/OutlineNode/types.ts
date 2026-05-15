/** 大纲编辑器面板的标签页类型 */
export type TabId = 'world' | 'mainline' | 'character' | 'volume' | 'chapter';

/** 标签页定义 */
export interface TabDef {
  id: TabId;
  label: string;
}

/** 标签页配置列表 */
export const TABS: TabDef[] = [
  { id: 'world', label: '世界观' },
  { id: 'mainline', label: '主线' },
  { id: 'character', label: '人物' },
  { id: 'volume', label: '卷大纲' },
  { id: 'chapter', label: '章节锚点' },
];

/** 面板宽度常量 */
export const MIN_WIDTH = 400;
export const MAX_WIDTH = 600;
