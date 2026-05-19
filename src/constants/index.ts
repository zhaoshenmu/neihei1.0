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

/** 
 * 画布 UI 配置（原 Canvas.config.ts 已合并至此，请勿在其他位置重复定义）
 * 所有画布配置集中于此，确保单一数据源
 */
export const CANVAS_CONFIG = {
  /** 默认缩放级别 */
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  /** 最小缩放 */
  minZoom: 0.25,
  /** 最大缩放 */
  maxZoom: 2.5,
  /** 节点之间的默认间距 */
  nodeGap: 24,
  /** 拖拽时吸附网格大小 (0 表示不吸附) */
  snapToGrid: 20,
  /** 边缘动画持续时间 (ms) */
  edgeAnimationDuration: 300,
  /** 连接线样式 - 灰色 */
  edgeStyle: {
    stroke: '#555555',
    strokeWidth: 1.5,
    animated: false,
  },
  /** 选中边样式 - 淡蓝灰 */
  edgeSelectedStyle: {
    stroke: '#6a9fb5',
    strokeWidth: 2,
    animated: true,
  },
  /** 默认连线类型 */
  edgeType: 'smoothstep' as const,
  /** 背景网格配置 */
  backgroundPattern: {
    color: '#2a2a2a',
    size: 24,
    gap: 4,
    thickness: 0.5,
  },
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

/** 存储键名（必须与各 persist store 的 name 一致） */
export const STORAGE_KEYS = {
  CANVAS_STATE: 'neihei-canvas',
  THEME: 'neihei_theme',
  WORLD_EDITOR_FLOW: 'neihei-world-editor-flow',
} as const;

/** 默认端口颜色（按类型） */
export const PORT_COLORS = {
  INPUT: '#6a9fb5',
  OUTPUT: '#b58a6a',
  EXECUTION: '#d4a84b',
} as const;

/** 插件拖拽 MIME 类型 */
export const PLUGIN_DRAG_MIME_TYPE = 'application/plugin-type';

/** 世界编辑器 - Outline 面板尺寸 */
export const PANEL_WIDTH = 400;
export const PANEL_DEFAULT_HEIGHT = 900;
export const PANEL_MIN_HEIGHT = 400;
export const PANEL_MAX_HEIGHT = 1200;
