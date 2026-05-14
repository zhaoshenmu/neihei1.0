/**
 * 画布配置常量
 * 包含画布默认设置和主题色等
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
