/**
 * useCanvasContextMenu.ts
 *
 * 画布右键菜单状态管理 Hook
 * 管理节点/空白区域/浮窗的右键菜单
 */
import { useState, useCallback } from 'react';
import { type Node } from '@xyflow/react';

export type ContextMenuType = 'node' | 'pane';
export type FloatContextMenu = {
  x: number;
  y: number;
  floatId: string;
  isSticky: boolean;
};

export interface NodeContextMenu {
  x: number;
  y: number;
  type: 'node';
  nodeId: string;
}

export interface PaneContextMenu {
  x: number;
  y: number;
  type: 'pane';
}

export type CanvasContextMenu = NodeContextMenu | PaneContextMenu;

export function useCanvasContextMenu() {
  const [contextMenu, setContextMenu] = useState<CanvasContextMenu | null>(null);
  const [contextMenuFloat, setContextMenuFloat] = useState<FloatContextMenu | null>(null);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      nodeId: node.id,
    });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: (event as React.MouseEvent).clientX || (event as MouseEvent).clientX,
      y: (event as React.MouseEvent).clientY || (event as MouseEvent).clientY,
      type: 'pane',
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeContextMenuFloat = useCallback(() => {
    setContextMenuFloat(null);
  }, []);

  const handleFloatContextMenu = useCallback(
    (floatId: string, isSticky: boolean, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuFloat({
        x: e.clientX,
        y: e.clientY,
        floatId,
        isSticky,
      });
    },
    []
  );

  return {
    contextMenu,
    contextMenuFloat,
    onNodeContextMenu,
    onPaneContextMenu,
    closeContextMenu,
    closeContextMenuFloat,
    handleFloatContextMenu,
  };
}
