/**
 * canvas-bounds.ts
 *
 * 获取画布容器相对于视口的边界矩形
 * 用于约束所有浮动面板/弹窗不超出画布区域
 * 
 * 画布容器是 App.tsx 中 <Canvas> 的外层包裹 div：
 * <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
 *   <Canvas ... />
 * </div>
 *
 * 该 div 加上 data-canvas-container 属性，便于 DOM 查询
 */

export interface CanvasBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

/** 从全局 DOM 中获取画布容器边界（相对于视口） */
export function getCanvasBounds(): CanvasBounds | null {
  const el = document.querySelector('[data-canvas-container]');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

/**
 * 将 position: fixed 元素的坐标约束在画布容器内
 * @param x 元素目标 left
 * @param y 元素目标 top
 * @param width 元素宽度
 * @param height 元素高度
 * @param padding 内边距（避免贴边）
 */
export function clampPositionWithinCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number = 4,
): { x: number; y: number } {
  const bounds = getCanvasBounds();
  if (!bounds) return { x, y };

  return {
    x: Math.max(bounds.left + padding, Math.min(x, bounds.right - width - padding)),
    y: Math.max(bounds.top + padding, Math.min(y, bounds.bottom - height - padding)),
  };
}
