/**
 * usePaneCreate.ts
 *
 * 双击画布空白创建节点 Hook
 * 实现双击画布空白弹出节点选择菜单，选中后创建节点
 */
import { useState, useCallback, useRef } from 'react';
import { type XYPosition } from '@xyflow/react';

export interface PaneCreateMenuState {
  x: number;
  y: number;
}

export function usePaneCreate() {
  const [paneCreateMenu, setPaneCreateMenu] = useState<PaneCreateMenuState | null>(null);
  const paneCreatePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const lastPaneClickRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  /** 监听单击，检测双击（<300ms 间隔且 <10px 距离） */
  const onPaneClick = useCallback(
    (
      event: React.MouseEvent<Element, MouseEvent>,
      screenToFlowPosition: (pos: { x: number; y: number }) => XYPosition
    ) => {
      const clientX = event.clientX;
      const clientY = event.clientY;
      const now = Date.now();
      const last = lastPaneClickRef.current;
      const timeDiff = now - last.time;
      const dist = Math.sqrt(
        Math.pow(clientX - last.x, 2) + Math.pow(clientY - last.y, 2)
      );

      if (timeDiff < 300 && timeDiff > 20 && dist < 10) {
        // 双击
        setPaneCreateMenu({ x: clientX, y: clientY });
        paneCreatePosRef.current = screenToFlowPosition({ x: clientX, y: clientY });
        lastPaneClickRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastPaneClickRef.current = { time: now, x: clientX, y: clientY };
      }
    },
    []
  );

  /** 关闭菜单 */
  const closePaneCreateMenu = useCallback(() => {
    setPaneCreateMenu(null);
  }, []);

  /** 获取创建位置 */
  const getCreatePosition = useCallback(() => paneCreatePosRef.current, []);

  return {
    paneCreateMenu,
    onPaneClick,
    closePaneCreateMenu,
    getCreatePosition,
  };
}
