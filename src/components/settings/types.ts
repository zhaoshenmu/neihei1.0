/**
 * 设置面板类型定义
 */

/** 左侧导航项 */
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
}

/** 预设导航项 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'general-api', label: '大模型API', icon: '🤖' },
  { id: 'local-api', label: '本地LM Studio API调用', icon: '💻' },
  { id: 'image-api', label: '生图大模型API(预留)', icon: '🎨' },
];
