/**
 * useFloatingPanels.ts
 *
 * 悬浮/置顶面板状态管理 Hook
 * 管理双击节点弹出的配置面板和置顶面板的生命周期
 */
import { useState, useCallback } from 'react';
import { type Node } from '@xyflow/react';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { useStickyPanelStore } from '@/store/useStickyPanelStore';
import { PANEL_WIDTH, PANEL_DEFAULT_HEIGHT } from '@/chajian/OutlineNode/types';

/** 每个弹出浮窗的状态 */
export interface FloatingPanel {
  id: string;
  nodeId: string;
  pluginType: string;
  PanelComp: React.ComponentType<{ nodeId: string }>;
  x: number;
  y: number;
  width: number;
  height: number;
}

let floatingIdCounter = 0;

export function useFloatingPanels() {
  const [floats, setFloats] = useState<FloatingPanel[]>([]);

  const addStickyPanel = useStickyPanelStore((s) => s.addPanel);
  const removeStickyPanel = useStickyPanelStore((s) => s.removePanel);
  const updateStickyPosition = useStickyPanelStore((s) => s.updatePosition);
  const updateStickySize = useStickyPanelStore((s) => s.updateSize);
  const bringToFront = useStickyPanelStore((s) => s.bringToFront);
  const stickyPanels = useStickyPanelStore((s) => s.panels);

  /** 关闭指定浮窗 */
  const closeFloat = useCallback((floatId: string) => {
    setFloats((prev) => prev.filter((f) => f.id !== floatId));
  }, []);

  /** 更新指定浮窗的位置/大小 */
  const updateFloat = useCallback(
    (floatId: string, partial: Partial<Pick<FloatingPanel, 'x' | 'y' | 'width' | 'height'>>) => {
      setFloats((prev) => prev.map((f) => (f.id === floatId ? { ...f, ...partial } : f)));
    },
    []
  );

  /** 置顶到画布（保持当前浮窗位置/大小） */
  const handleSticky = useCallback(
    (floatId: string) => {
      const fp = floats.find((f) => f.id === floatId);
      if (!fp) return;
      addStickyPanel({
        id: `${fp.pluginType}:${fp.nodeId}`,
        pluginType: fp.pluginType,
        nodeId: fp.nodeId,
        label: fp.pluginType,
        x: fp.x,
        y: fp.y,
        width: fp.width,
        height: fp.height,
      });
      closeFloat(floatId);
    },
    [floats, addStickyPanel, closeFloat]
  );

  /** 双击节点打开浮窗 */
  const openFloatForNode = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const pluginType = node.type;
      if (!pluginType) return;

      // 同一类型插件全局只弹出一个面板
      const hasPanelOpen =
        floats.some((f) => f.pluginType === pluginType) ||
        stickyPanels.some((p) => p.pluginType === pluginType);
      if (hasPanelOpen) {
        console.log(`[Canvas] ${pluginType} 类型已有面板打开，不再重复弹出`);
        return;
      }

      const PanelComp = pluginRegistry.getPanel(pluginType);
      if (!PanelComp) {
        console.warn(`[Canvas] 节点 "${pluginType}" 没有 Panel 组件`);
        return;
      }

      // 大纲编辑器使用固定宽 400、默认高 900
      const isOutline = pluginType === 'outline';
      const w = isOutline ? PANEL_WIDTH : 420;
      const h = isOutline ? PANEL_DEFAULT_HEIGHT : 300;
      const cx = Math.max(0, (window.innerWidth - w) / 2);
      const cy = Math.max(0, (window.innerHeight - h) / 2);
      const fid = `float-${++floatingIdCounter}`;

      setFloats((prev) => [
        ...prev,
        {
          id: fid,
          nodeId: node.id,
          pluginType,
          PanelComp,
          x: cx,
          y: cy,
          width: w,
          height: h,
        },
      ]);
    },
    [floats, stickyPanels]
  );

  /** 检查某个 nodeId 是否已置顶 */
  const isStickied = useCallback(
    (nodeId: string) => stickyPanels.some((p) => p.nodeId === nodeId),
    [stickyPanels]
  );

  return {
    floats,
    stickyPanels,
    closeFloat,
    updateFloat,
    handleSticky,
    openFloatForNode,
    isStickied,
    addStickyPanel,
    removeStickyPanel,
    updateStickyPosition,
    updateStickySize,
    bringToFront,
  };
}
