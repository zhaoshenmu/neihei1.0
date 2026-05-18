/**
 * 项目全局常量
 *
 * 原则：所有魔法数字、字符串字面量、配置默认值都应集中在此处，
 * 而不是散落在各组件中。既方便维护，也防止硬编码重复。
 */

/** 画布相关常量 */
export const CANVAS = {
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2.5,
  DEFAULT_VIEWPORT: { x: 0, y: 0, zoom: 1 },
  GRID_SIZE: 20,
  /** 背景点阵大小 */
  DOT_SIZE: 2,
  /** 背景点阵间距 */
  DOT_GAP: 24,
} as const;

/** 节点尺寸常量 */
export const NODE = {
  MIN_WIDTH: 200,
  HEADER_HEIGHT: 36,
  PORT_SIZE: 8,
} as const;

/** 日志面板常量 */
export const LOG_PANEL = {
  DEFAULT_HEIGHT: 300,
  MIN_HEIGHT: 100,
  MAX_HEIGHT: 600,
  MAX_ENTRIES: 1000,
} as const;

/** 存储键名 */
export const STORAGE_KEYS = {
  CANVAS_STATE: 'neihei_canvas_state',
  THEME: 'neihei_theme',
} as const;

/** 默认端口颜色（按类型） */
export const PORT_COLORS = {
  INPUT: '#6a9fb5',
  OUTPUT: '#b58a6a',
  EXECUTION: '#d4a84b',
} as const;

/** 插件拖拽 MIME 类型 */
export const PLUGIN_DRAG_MIME_TYPE = 'application/plugin-type';
