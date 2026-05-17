/**
 * 画布主组件
 * 基于 React Flow 的节点编辑画布
 * 
 * 双击弹出逻辑（简化版）：
 * - 每个节点双击弹出配置面板
 * - 如果该节点已经有弹出面板打开中，不再重复弹出
 * - 置顶按钮始终显示（除非对应的面板已置顶）
 * - 置顶面板关闭后，再次双击可重新弹出
 */
import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type XYPosition,
  SelectionMode,
  type Viewport,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store';
import { buildNodeTypes } from '@/nodes';
import { theme } from '@/theme/neihei-theme';
import { CANVAS_CONFIG } from './Canvas.config';
import BezierEdge from './BezierEdge';
import FlowEdge from './FlowEdge';
import CanvasControls from './CanvasControls';
import { FloatingContainer } from '@/floating/FloatingContainer';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { useStickyPanelStore } from '@/store/useStickyPanelStore';
import { useSettingsStore } from '@/store/settings-store';
import { handleDropEvent, handleKeyDelete } from './Canvas.handlers';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import QuickConnectMenu from './QuickConnectMenu';
import { PANEL_WIDTH, PANEL_DEFAULT_HEIGHT, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT } from '@/chajian/OutlineNode/types';

interface CanvasProps {
  onAddNode?: (type: string, position: XYPosition) => void;
  pluginLoaded?: boolean;
}

/** 每个弹出浮窗的状态 */
interface FloatingPanel {
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

const Canvas: React.FC<CanvasProps> = ({ onAddNode, pluginLoaded = false }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    getViewport: () => Viewport;
    screenToFlowPosition: (pos: { x: number; y: number }) => XYPosition;
    fitView: (opts?: { padding?: number }) => void;
  } | null>(null);

  // ── 从 settings store 读取快捷键配置 ──
  const shortcuts = useSettingsStore((s) => s.shortcuts);

  // 将 store 中的快捷键格式转为 React Flow 可识别的格式
  const flowDeleteKeyCode = useMemo(() => {
    const del = shortcuts.find((s) => s.id === 'delete');
    return del ? del.keys : ['Delete'];
  }, [shortcuts]);

  const flowMultiSelectionKeyCode = useMemo(() => {
    const ms = shortcuts.find((s) => s.id === 'multi_select');
    if (!ms || ms.keys.length === 0) return 'Shift';
    // multiSelectionKeyCode 只认修饰键，取第一个（Shift/Ctrl/Alt/Meta）
    const modKey = ms.keys[0] === 'Click' ? ms.keys[ms.keys.length - 1] : ms.keys[0];
    return modKey;
  }, [shortcuts]);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNodes,
    selectedNodeIds,
    setSelectedNodes,
  } = useCanvasStore();

  const edgeLineStyle = useSettingsStore((s) => s.edgeLineStyle);

  const nodeTypes = useMemo(() => buildNodeTypes(), [pluginLoaded]);
  const edgeTypes = useMemo(() => {
    if (edgeLineStyle === '流动') {
      return { bezier: FlowEdge };
    }
    return { bezier: BezierEdge };
  }, [edgeLineStyle]);

  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
    setTimeout(() => {
      try { instance.fitView({ padding: 0.2 }); } catch {}
    }, 50);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (!reactFlowWrapper.current || !reactFlowInstance) {return;}
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      handleDropEvent(
        event as unknown as DragEvent,
        bounds,
        () => reactFlowInstance.getViewport(),
        (type: string, pos: XYPosition) => {
          addNode(type, pos);
          if (onAddNode) {onAddNode(type, pos);}
        }
      );
    },
    [reactFlowInstance, addNode, onAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // 从当前 store 读取 delete 快捷键配置
      const currentShortcuts = useSettingsStore.getState().shortcuts;
      const delEntry = currentShortcuts.find((s) => s.id === 'delete');
      const deleteKeys = delEntry ? delEntry.keys : ['Delete'];

      if (deleteKeys.includes(event.key)) {
        handleKeyDelete(selectedNodeIds, removeNodes);
      }
      if (event.key === 'Escape') {
        setSelectedNodes([]);
      }
    },
    [selectedNodeIds, removeNodes, setSelectedNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  // ── 右键菜单状态（画布节点/空白） ──
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'node' | 'pane';
    nodeId?: string;
  } | null>(null);

  // ── 浮窗右键菜单状态 ──
  const [contextMenuFloat, setContextMenuFloat] = useState<{
    x: number;
    y: number;
    floatId: string;
    isSticky: boolean;
  } | null>(null);
  const toggleCollapseNode = useCanvasStore((s) => s.toggleCollapseNode);
  const collapseAllNodes = useCanvasStore((s) => s.collapseAllNodes);
  const expandAllNodes = useCanvasStore((s) => s.expandAllNodes);
  const collapsedNodes = useCanvasStore((s) => s.collapsedNodes);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'node',
        nodeId: node.id,
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: (event as React.MouseEvent).clientX || (event as MouseEvent).clientX,
        y: (event as React.MouseEvent).clientY || (event as MouseEvent).clientY,
        type: 'pane',
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeContextMenuFloat = useCallback(() => {
    setContextMenuFloat(null);
  }, []);

  /** 处理浮窗右键菜单 */
  const handleFloatContextMenu = useCallback((floatId: string, isSticky: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFloat({
      x: e.clientX,
      y: e.clientY,
      floatId,
      isSticky,
    });
  }, []);

  // ── 快速连接菜单（从端口拖出连线到空白处时弹出） ──
  // handleType: 'source' = 从输出口拖出, 'target' = 从输入口拖出
  const [quickConnectMenu, setQuickConnectMenu] = useState<{
    x: number;
    y: number;
    sourceNodeId: string;
    sourceHandleId: string | null;
    handleType: 'source' | 'target' | null;
  } | null>(null);
  // ref 标记用户是否正在拖出连线（onConnectStart 设 true，onConnect 设 false）
  const isConnectingRef = useRef(false);

  // ── 悬浮窗列表（每个节点独立弹出，互不替换） ──
  const [floats, setFloats] = useState<FloatingPanel[]>([]);

  // ── 读取 store ──
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
  const updateFloat = useCallback((floatId: string, partial: Partial<Pick<FloatingPanel, 'x' | 'y' | 'width' | 'height'>>) => {
    setFloats((prev) => prev.map((f) => f.id === floatId ? { ...f, ...partial } : f));
  }, []);

  /** 置顶到画布（保持当前浮窗位置/大小） */
  const handleSticky = useCallback((floatId: string) => {
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
  }, [floats, addStickyPanel, closeFloat]);

  // ── 双击节点 ──
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    async (_event, node) => {
      const pluginType = node.type;
      if (!pluginType) return;

      // 检查该类型是否已有面板打开（浮窗或置顶）
      // 同一类型插件全局只弹出一个面板，无论多少个实例
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

  const defaultEdgeOptions = useMemo(
    () => ({
      style: CANVAS_CONFIG.edgeStyle,
      activeStyle: CANVAS_CONFIG.edgeSelectedStyle,
      selectedStyle: CANVAS_CONFIG.edgeSelectedStyle,
      type: 'bezier' as const,
    }),
    []
  );

  // ── 渲染置顶面板 ──
  const renderStickyPanels = () => {
    return stickyPanels.map((sticky) => {
      const PanelComp = pluginRegistry.getPanel(sticky.pluginType);
      if (!PanelComp) return null;

      const handleCloseSticky = () => {
        removeStickyPanel(sticky.id);
      };

      return (
        <FloatingContainer
          key={sticky.id}
          nodeId={sticky.nodeId}
          pluginType={sticky.pluginType}
          title={sticky.label || sticky.pluginType}
          isSticky
          defaultX={sticky.x}
          defaultY={sticky.y}
          defaultWidth={sticky.width}
          defaultHeight={sticky.height}
          onClose={handleCloseSticky}
          onSticky={handleCloseSticky}
          onDragStop={(x, y) => updateStickyPosition(sticky.id, x, y)}
          onResizeStop={(w, h) => updateStickySize(sticky.id, w, h)}
          onClick={() => bringToFront(sticky.id)}
          onContextMenu={(e) => handleFloatContextMenu(sticky.id, true, e)}
        >
          <PanelComp nodeId={sticky.nodeId} />
        </FloatingContainer>
      );
    });
  };

  // 检查某个 nodeId 是否已置顶
  const isStickied = useCallback((nodeId: string) => {
    return stickyPanels.some((p) => p.nodeId === nodeId);
  }, [stickyPanels]);

  // ── 快速连接菜单逻辑 ──

  // 用 ref 同步记录源头信息，避免闭包过期问题
  const quickConnectMenuRef = useRef<{
    sourceNodeId: string;
    sourceHandleId: string | null;
    handleType: 'source' | 'target' | null;
  }>({ sourceNodeId: '', sourceHandleId: null, handleType: null });

  /** 开始拖出连线时记录源头信息 */
  const onConnectStart = useCallback(
    (_event: any, params: { nodeId: string | null; handleId: string | null; handleType: string | null }) => {
      isConnectingRef.current = true;
      quickConnectMenuRef.current = {
        sourceNodeId: params.nodeId ?? '',
        sourceHandleId: params.handleId,
        handleType: params.handleType as 'source' | 'target' | null,
      };
    },
    []
  );

  /** onConnect 的包装：用户成功连到目标节点时调用（禁止弹出菜单） */
  const handleConnect = useCallback(
    (connection: any) => {
      isConnectingRef.current = false; // 已成功连线，onConnectEnd 不再弹出菜单
      onConnect(connection);
    },
    [onConnect]
  );

  /** 拖放结束：如果没连到节点则弹出快速选择菜单 */
  const onConnectEnd = useCallback(
    (event: any) => {
      if (!isConnectingRef.current) return; // 已连到目标节点，不弹菜单

      isConnectingRef.current = false;

      // 获取鼠标屏幕坐标
      const clientX = event?.clientX ?? event?.sourceEvent?.clientX ?? 0;
      const clientY = event?.clientY ?? event?.sourceEvent?.clientY ?? 0;

      if (!quickConnectMenuRef.current.sourceNodeId) return;

      setQuickConnectMenu({
        x: clientX + 10,
        y: clientY + 10,
        sourceNodeId: quickConnectMenuRef.current.sourceNodeId,
        sourceHandleId: quickConnectMenuRef.current.sourceHandleId,
        handleType: quickConnectMenuRef.current.handleType,
      });
    },
    []
  );

  /** 从菜单选择节点类型后：创建节点+连线 */
  const handleQuickSelect = useCallback(
    (type: string) => {
      if (!quickConnectMenu || !reactFlowInstance) return;

      const { sourceNodeId, sourceHandleId, handleType, x, y } = quickConnectMenu;

      const targetManifest = pluginRegistry.getManifest(type);

      // 从输出口(source)拖线 → 新节点必须有输入口
      // 从输入口(target)拖线 → 新节点必须有输出口
      if (handleType === 'source') {
        if (!targetManifest || !targetManifest.inputs || targetManifest.inputs.length === 0) {
          console.warn(`[Canvas] 节点 "${type}" 没有输入口，不能作为连线目标`);
          setQuickConnectMenu(null);
          return;
        }
      } else if (handleType === 'target') {
        if (!targetManifest || !targetManifest.outputs || targetManifest.outputs.length === 0) {
          console.warn(`[Canvas] 节点 "${type}" 没有输出口，不能作为连线源`);
          setQuickConnectMenu(null);
          return;
        }
      } else {
        // 没有 handleType（安全兜底），关闭菜单
        setQuickConnectMenu(null);
        return;
      }

      // 将屏幕坐标转为画布坐标
      const flowPos = reactFlowInstance.screenToFlowPosition({ x, y });

      // 1) 创建新节点
      const newNodeId = addNode(type, flowPos);

      // 2) 创建连线（方向取决于从哪个端口拖出）
      let newEdge: { source: string; target: string; sourceHandle: string | null; targetHandle: string | null };
      if (handleType === 'source') {
        // 从输出口拖出：当前节点 → 新节点
        newEdge = {
          source: sourceNodeId,
          target: newNodeId,
          sourceHandle: sourceHandleId,
          targetHandle: null,
        };
      } else {
        // 从输入口拖出：新节点 → 当前节点
        newEdge = {
          source: newNodeId,
          target: sourceNodeId,
          sourceHandle: null,
          targetHandle: sourceHandleId,
        };
      }
      // 通过 store 的 onConnect 添加边
      onConnect(newEdge);

      // 3) 关闭菜单
      setQuickConnectMenu(null);
    },
    [quickConnectMenu, reactFlowInstance, addNode, onConnect]
  );

  /** 关闭快速连接菜单 */
  // ── 双击画布空白弹出「选择节点」菜单（通过点击时间戳检测，绕过 ReactFlow 事件拦截） ──
  const [paneCreateMenu, setPaneCreateMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const paneCreatePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const lastPaneClickRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  const onPaneClick = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>) => {
      const clientX = event.clientX;
      const clientY = event.clientY;
      const now = Date.now();
      const last = lastPaneClickRef.current;
      const timeDiff = now - last.time;
      const dist = Math.sqrt(
        Math.pow(clientX - last.x, 2) + Math.pow(clientY - last.y, 2)
      );

      // 两次点击间隔 < 300ms 且距离 < 10px 视为双击
      if (timeDiff < 300 && timeDiff > 20 && dist < 10) {
        setPaneCreateMenu({ x: clientX, y: clientY });
        if (reactFlowInstance) {
          paneCreatePosRef.current = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
        }
        // 重置，防止弹出第二个
        lastPaneClickRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastPaneClickRef.current = { time: now, x: clientX, y: clientY };
      }
    },
    [reactFlowInstance]
  );

  /** 从画布双击菜单选中节点类型后：创建节点（无连线） */
  const handlePaneCreateSelect = useCallback(
    (type: string) => {
      if (!paneCreateMenu) return;
      addNode(type, paneCreatePosRef.current);
      setPaneCreateMenu(null);
    },
    [paneCreateMenu, addNode]
  );

  const closePaneCreateMenu = useCallback(() => {
    setPaneCreateMenu(null);
  }, []);

  const closeQuickConnect = useCallback(() => {
    setQuickConnectMenu(null);
  }, []);

  return (
    <div
      ref={reactFlowWrapper}
      style={{
        width: '100%',
        height: '100%',
        background: theme.colors.canvasBg,
        position: 'relative',
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {renderStickyPanels()}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnDrag={[1, 2]}
        deleteKeyCode={flowDeleteKeyCode}
        multiSelectionKeyCode={flowMultiSelectionKeyCode}
        snapToGrid={true}
        snapGrid={[1, 1]}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        defaultViewport={CANVAS_CONFIG.defaultViewport}
        fitView={false}
        style={{ background: theme.colors.canvasBg }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={CANVAS_CONFIG.backgroundPattern.size}
          size={CANVAS_CONFIG.backgroundPattern.thickness}
          color={CANVAS_CONFIG.backgroundPattern.color}
        />
        <CanvasControls />
      </ReactFlow>

      {/* 右键菜单 */}
      {contextMenu && (() => {
        if (contextMenu.type === 'node') {
          const nodeId = contextMenu.nodeId!;
          const isCollapsed = collapsedNodes.includes(nodeId);
          const items: ContextMenuItem[] = [
            {
              label: isCollapsed ? '展开节点' : '收起节点',
              onClick: () => toggleCollapseNode(nodeId),
            },
          ];
          return (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              items={items}
              onClose={closeContextMenu}
            />
          );
        }
        // pane 级别菜单
        const hasCollapsed = collapsedNodes.length > 0;
        const items: ContextMenuItem[] = [
          {
            label: '全部收起',
            onClick: () => collapseAllNodes(),
            disabled: nodes.length === 0,
          },
          {
            label: '全部展开',
            onClick: () => expandAllNodes(),
            disabled: !hasCollapsed,
          },
        ];
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={items}
            onClose={closeContextMenu}
          />
        );
      })()}

      {/* 浮窗右键菜单 */}
      {contextMenuFloat && (() => {
        const { floatId, isSticky } = contextMenuFloat;
        const items: ContextMenuItem[] = [];
        if (!isSticky) {
          items.push({
            label: '置顶到画布',
            onClick: () => handleSticky(floatId),
          });
        }
        items.push({
          label: '关闭面板',
          onClick: () => {
            if (isSticky) {
              removeStickyPanel(floatId);
            } else {
              closeFloat(floatId);
            }
          },
        });
        return (
          <ContextMenu
            x={contextMenuFloat.x}
            y={contextMenuFloat.y}
            items={items}
            onClose={closeContextMenuFloat}
          />
        );
      })()}

      {/* 快速连接菜单：从端口拖出连线到空白处时弹出 */}
      {quickConnectMenu && (
        <QuickConnectMenu
          x={quickConnectMenu.x}
          y={quickConnectMenu.y}
          onSelect={handleQuickSelect}
          onClose={closeQuickConnect}
          fromHandleType={quickConnectMenu.handleType}
        />
      )}

      {/* 双击画布空白弹出「选择节点」菜单 */}
      {paneCreateMenu && (
        <QuickConnectMenu
          x={paneCreateMenu.x}
          y={paneCreateMenu.y}
          onSelect={handlePaneCreateSelect}
          onClose={closePaneCreateMenu}
        />
      )}

      {/* 所有双击弹出的悬浮配置面板 */}
      {floats.map((fp) => {
        const alreadyStickied = isStickied(fp.nodeId);
        const isOutline = fp.pluginType === 'outline';

        return (
          <FloatingContainer
            key={fp.id}
            nodeId={fp.nodeId}
            pluginType={fp.pluginType}
            title={fp.pluginType}
            isSticky={false}
            defaultX={fp.x}
            defaultY={fp.y}
            defaultWidth={fp.width}
            defaultHeight={fp.height}
            onClose={() => closeFloat(fp.id)}
            onSticky={!alreadyStickied ? () => handleSticky(fp.id) : undefined}
            onDragStop={(x, y) => updateFloat(fp.id, { x, y })}
            onResizeStop={(w, h) => updateFloat(fp.id, { width: w, height: h })}
            onContextMenu={(e) => handleFloatContextMenu(fp.id, false, e)}
            minWidth={isOutline ? PANEL_WIDTH : 300}
            maxWidth={isOutline ? PANEL_WIDTH : undefined}
            minHeight={isOutline ? PANEL_MIN_HEIGHT : 180}
            maxHeight={isOutline ? PANEL_MAX_HEIGHT : undefined}
          >
            <fp.PanelComp nodeId={fp.nodeId} />
          </FloatingContainer>
        );
      })}
    </div>
  );
};

export default Canvas;
