/**
 * 画布事件处理函数
 * 处理拖拽、选择、删除等交互事件
 */
import type { Node, Edge, XYPosition } from '@xyflow/react';

/**
 * 处理从侧边栏拖拽节点到画布
 * 将拖拽数据转换为画布坐标
 */
export function handleDropEvent(
  event: DragEvent,
  reactFlowBounds: DOMRect,
  getViewport: () => { x: number; y: number; zoom: number },
  addNodeFromSidebar: (type: string, position: XYPosition) => void
): void {
  event.preventDefault();

  const pluginType = event.dataTransfer?.getData('application/plugin-type');
  if (!pluginType) {return;}

  // 将屏幕坐标转换为画布坐标
  const position: XYPosition = {
    x: (event.clientX - reactFlowBounds.left - (getViewport()?.x || 0)) / (getViewport()?.zoom || 1),
    y: (event.clientY - reactFlowBounds.top - (getViewport()?.y || 0)) / (getViewport()?.zoom || 1),
  };

  addNodeFromSidebar(pluginType, position);
}

/**
 * 处理节点删除（键盘 Delete 键）
 */
export function handleKeyDelete(
  selectedNodeIds: string[],
  removeNodes: (ids: string[]) => void
): void {
  if (selectedNodeIds.length > 0) {
    removeNodes(selectedNodeIds);
  }
}

/**
 * 格式化画布数据用于导出/保存
 */
export function serializeCanvas(nodes: Node[], edges: Edge[]): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  };
  return JSON.stringify(data, null, 2);
}
