/**
 * Canvas.tsx (重构版)
 *
 * 画布主组件 — 基于 React Flow 的节点编辑画布
 *
 * P2-1 重构：将悬浮面板、右键菜单、快速连接、双击创建
 * 等状态管理抽离到独立 hooks，Canvas.tsx 仅保留 JSX 渲染
 *
 * 行数：~500 → ~200
 */
import React, { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type XYPosition,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store';
import { buildNodeTypes } from '@/nodes';
import { theme } from '@/theme/neihei-theme';
import { CANVAS_CONFIG } from '@/constants';
import BezierEdge from './BezierEdge';
import FlowEdge from './FlowEdge';
import CanvasControls from './CanvasControls';
import { FloatingContainer } from '@/floating/FloatingContainer';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { useSettingsStore } from '@/store/settings-store';
import { handleDropEvent, handleKeyDelete } from './Canvas.handlers';
import ContextMenu from './ContextMenu';
import QuickConnectMenu from './QuickConnectMenu';
import { PANEL_WIDTH, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT } from '@/constants';

import { useFloatingPanels } from './useFloatingPanels';
import { ZhangGuSiPanels } from '@/plugins/zhang-gu-si';
import { useCanvasContextMenu } from './useCanvasContextMenu';
import { useQuickConnect } from './useQuickConnect';
import { usePaneCreate } from './usePaneCreate';

interface CanvasProps {
  onAddNode?: (type: string, position: XYPosition) => void;
  pluginLoaded?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ onAddNode, pluginLoaded = false }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<{
    getViewport: () => { x: number; y: number; zoom: number };
    screenToFlowPosition: (pos: { x: number; y: number }) => XYPosition;
    fitView: (opts?: { padding?: number }) => void;
  } | null>(null);

  // ── Store ──
  const shortcuts = useSettingsStore((s) => s.shortcuts);
  const edgeLineStyle = useSettingsStore((s) => s.edgeLineStyle);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect: storeOnConnect,
    addNode,
    removeNodes,
    selectedNodeIds,
    setSelectedNodes,
    collapsedNodes,
    toggleCollapseNode,
    collapseAllNodes,
    expandAllNodes,
  } = useCanvasStore();

  // ── 快捷键 ──
  const flowDeleteKeyCode = useMemo(() => {
    const del = shortcuts.find((s) => s.id === 'delete');
    return del ? del.keys : ['Delete'];
  }, [shortcuts]);
  const flowMultiSelectionKeyCode = useMemo(() => {
    const ms = shortcuts.find((s) => s.id === 'multi_select');
    if (!ms || ms.keys.length === 0) return 'Shift';
    const modKey = ms.keys[0] === 'Click' ? ms.keys[ms.keys.length - 1] : ms.keys[0];
    return modKey;
  }, [shortcuts]);

  // ── Hooks ──
  const {
    floats,
    stickyPanels,
    closeFloat,
    updateFloat,
    handleSticky,
    openFloatForNode,
    isStickied,
    removeStickyPanel,
    updateStickyPosition,
    updateStickySize,
    bringToFront,
  } = useFloatingPanels();

  const {
    contextMenu,
    contextMenuFloat,
    onNodeContextMenu,
    onPaneContextMenu,
    closeContextMenu,
    closeContextMenuFloat,
    handleFloatContextMenu,
  } = useCanvasContextMenu();

  const {
    quickConnectMenu,
    onConnectStart,
    onConnectEnd,
    markConnected,
    closeQuickConnect,
  } = useQuickConnect();

  const {
    paneCreateMenu,
    onPaneClick: onPaneClickRaw,
    closePaneCreateMenu,
    getCreatePosition,
  } = usePaneCreate();

  // ── 节点类型 ──
  const nodeTypes = useMemo(() => buildNodeTypes(), [pluginLoaded]);
  const edgeTypes = useMemo(() => {
    return edgeLineStyle === '流动' ? { bezier: FlowEdge } : { bezier: BezierEdge };
  }, [edgeLineStyle]);

  // ── 画布初始化 ──
  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
    setTimeout(() => {
      try { instance.fitView({ padding: 0.2 }); } catch { /* ignore */ }
    }, 50);
  }, []);

  // ── 拖拽添加节点 ──
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      handleDropEvent(
        event as unknown as DragEvent,
        bounds,
        () => reactFlowInstance.getViewport(),
        (type: string, pos: XYPosition) => {
          addNode(type, pos);
          if (onAddNode) onAddNode(type, pos);
        }
      );
    },
    [reactFlowInstance, addNode, onAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // ── 键盘事件 ──
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
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

  // ── onConnect 包装 ──
  const handleConnect = useCallback(
    (connection: any) => {
      markConnected();
      storeOnConnect(connection);
    },
    [storeOnConnect, markConnected]
  );

  // ── 单击事件（检测双击） ──
  const onPaneClick = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>) => {
      if (reactFlowInstance) {
        onPaneClickRaw(event, (pos) => reactFlowInstance.screenToFlowPosition(pos));
      }
    },
    [reactFlowInstance, onPaneClickRaw]
  );

  // ── 双击节点 → 打开浮窗 ──
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // 掌故司节点内部自行管理面板（双击标签弹出），跳过 Canvas 层自动创建
      if (node.type === 'memory') return;
      openFloatForNode(_event, node);
    },
    [openFloatForNode]
  );

  // ── 默认边选项 ──
  const defaultEdgeOptions = useMemo(
    () => ({
      style: CANVAS_CONFIG.edgeStyle,
      activeStyle: CANVAS_CONFIG.edgeSelectedStyle,
      selectedStyle: CANVAS_CONFIG.edgeSelectedStyle,
      type: 'bezier' as const,
    }),
    []
  );

  // ── 置顶面板渲染 ──
  const renderStickyPanels = () =>
    stickyPanels.map((sticky) => {
      const PanelComp = pluginRegistry.getPanel(sticky.pluginType);
      if (!PanelComp) return null;
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
          onClose={() => removeStickyPanel(sticky.id)}
          onSticky={() => removeStickyPanel(sticky.id)}
          onDragStop={(x, y) => updateStickyPosition(sticky.id, x, y)}
          onResizeStop={(w, h) => updateStickySize(sticky.id, w, h)}
          onClick={() => bringToFront(sticky.id)}
          onContextMenu={(e) => handleFloatContextMenu(sticky.id, true, e)}
        >
          <PanelComp nodeId={sticky.nodeId} />
        </FloatingContainer>
      );
    });

  // ── 浮窗面板渲染 ──
  const renderFloatPanels = () =>
    floats.map((fp) => {
      const alreadyStickied = isStickied(fp.nodeId);
      const isOutline = fp.pluginType === 'world-editor';
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
    });

  // ── 右键菜单渲染 ──
  const renderContextMenu = () => {
    if (!contextMenu) return null;
    if (contextMenu.type === 'node') {
      const nodeId = contextMenu.nodeId;
      const isCollapsed = collapsedNodes.includes(nodeId);
      return (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: isCollapsed ? '展开节点' : '收起节点',
              onClick: () => toggleCollapseNode(nodeId),
            },
          ]}
          onClose={closeContextMenu}
        />
      );
    }
    // pane 级别菜单
    return (
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        items={[
          {
            label: '全部收起',
            onClick: () => collapseAllNodes(),
            disabled: nodes.length === 0,
          },
          {
            label: '全部展开',
            onClick: () => expandAllNodes(),
            disabled: collapsedNodes.length === 0,
          },
        ]}
        onClose={closeContextMenu}
      />
    );
  };

  // ── 浮窗右键菜单渲染 ──
  const renderFloatContextMenu = () => {
    if (!contextMenuFloat) return null;
    const { floatId, isSticky } = contextMenuFloat;
    const items = [];
    if (!isSticky) {
      items.push({
        label: '置顶到画布',
        onClick: () => handleSticky(floatId),
      });
    }
    items.push({
      label: '关闭面板',
      onClick: () => {
        if (isSticky) removeStickyPanel(floatId);
        else closeFloat(floatId);
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
  };

  // ── 快速连接菜单 + 双击创建菜单 ──
  const renderQuickConnectMenu = () => {
    if (!quickConnectMenu) return null;
    return (
      <QuickConnectMenu
        x={quickConnectMenu.x}
        y={quickConnectMenu.y}
        onSelect={(type) => {
          if (!reactFlowInstance) return;
          const { sourceNodeId, sourceHandleId, handleType } = quickConnectMenu;
          const targetManifest = pluginRegistry.getManifest(type);
          if (handleType === 'source') {
            if (!targetManifest?.inputs?.length) { closeQuickConnect(); return; }
          } else if (handleType === 'target') {
            if (!targetManifest?.outputs?.length) { closeQuickConnect(); return; }
          } else {
            closeQuickConnect();
            return;
          }
          const flowPos = reactFlowInstance.screenToFlowPosition({ x: quickConnectMenu.x, y: quickConnectMenu.y });
          const newNodeId = addNode(type, flowPos);
          const newEdge = handleType === 'source'
            ? { source: sourceNodeId, target: newNodeId, sourceHandle: sourceHandleId, targetHandle: null }
            : { source: newNodeId, target: sourceNodeId, sourceHandle: null, targetHandle: sourceHandleId };
          storeOnConnect(newEdge as any);
          closeQuickConnect();
        }}
        onClose={closeQuickConnect}
        fromHandleType={quickConnectMenu.handleType}
      />
    );
  };

  const renderPaneCreateMenu = () => {
    if (!paneCreateMenu) return null;
    return (
      <QuickConnectMenu
        x={paneCreateMenu.x}
        y={paneCreateMenu.y}
        onSelect={(type) => {
          addNode(type, getCreatePosition());
          closePaneCreateMenu();
        }}
        onClose={closePaneCreateMenu}
      />
    );
  };

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%', background: theme.colors.canvasBg, position: 'relative' }}
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
        snapToGrid
        snapGrid={[1, 1]}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        defaultViewport={CANVAS_CONFIG.defaultViewport}
        fitView={false}
        style={{ background: theme.colors.canvasBg }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={CANVAS_CONFIG.backgroundPattern.size}
          size={CANVAS_CONFIG.backgroundPattern.thickness}
          color={CANVAS_CONFIG.backgroundPattern.color}
        />
        <CanvasControls />
      </ReactFlow>

      {renderContextMenu()}
      {renderFloatContextMenu()}
      {renderQuickConnectMenu()}
      {renderPaneCreateMenu()}
      {renderFloatPanels()}
      <ZhangGuSiPanels />
    </div>
  );
};

export default Canvas;
